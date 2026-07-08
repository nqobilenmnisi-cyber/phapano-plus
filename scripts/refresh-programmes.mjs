/**
 * Phapano+ — programme directory refresher (semi-automated).
 * =========================================================================
 * WHAT THIS DOES
 *   For every row in `programme_sources`, it fetches the official URL,
 *   detects whether the page changed (via a content hash), records
 *   `last_checked` / `last_changed`, runs a lightweight extractor for
 *   candidate application dates and fees, and — when it finds something —
 *   inserts a row into `programme_updates` (needs_review = true) instead of
 *   writing directly to the live directory. A human (or a future
 *   high-confidence rule) approves updates before they go live.
 *
 * WHY A QUEUE (not direct writes)
 *   Deadlines/fees/requirements must never be published unverified. The queue
 *   keeps automation and publication separate: automation gathers candidates;
 *   approval publishes them and sets `last_verified`.
 *
 * WHERE TO RUN IT
 *   Anywhere with network + Node 18+ (this repo's sandbox has NO network, so
 *   it cannot run there). Good homes:
 *     - locally:            node scripts/refresh-programmes.mjs
 *     - a GitHub Action / cron on a schedule (e.g. weekly, daily in season)
 *     - a Vercel Cron route or a Supabase Edge Function (port the logic)
 *
 * ENV REQUIRED (service role — server-side only, never ship to the browser)
 *     SUPABASE_URL=...           (your project URL)
 *     SUPABASE_SERVICE_ROLE_KEY=...   (Settings → API → service_role)
 *
 * INSTALL: none beyond what the app already uses (@supabase/supabase-js).
 *
 * RESPECT: set a real User-Agent, check each institution's terms/robots.txt,
 *   and keep the crawl slow and infrequent. This is a courtesy crawler for a
 *   handful of official pages, not a scraper farm.
 *
 * UPGRADE PATH (recommended): replace `naiveExtract()` with an LLM extraction
 *   step (you already use the Anthropic API elsewhere). Feed the page text and
 *   ask for structured JSON: {opening, deadline, fee, requirements, documents,
 *   confidence}. Keep the queue + review flow exactly as-is.
 * =========================================================================
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UA =
  "PhapanoPlusBot/1.0 (+https://phapano.com; psychology programme directory)";
const POLITE_DELAY_MS = 2500; // wait between requests

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strip HTML to rough text for hashing + naive extraction. */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Very small, conservative extractor. It only surfaces *candidates* for human
 * review — it never publishes. Confidence is intentionally low; the real work
 * should move to an LLM extraction step (see header).
 */
function naiveExtract(text) {
  const lower = text.toLowerCase();
  const near = (kw) => {
    const i = lower.indexOf(kw);
    return i === -1 ? null : text.slice(i, i + 200);
  };

  // Application fee like "R150", "R 1 500", "ZAR 300"
  const feeMatch = text.match(/\b(?:R|ZAR)\s?\d[\d ,.]{1,7}/);
  const fee = feeMatch ? feeMatch[0].replace(/\s+/g, " ").trim() : null;

  // Dates like "30 September 2026" or "2026-09-30"
  const dateRe =
    /\b(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i;
  const deadlineCtx =
    near("closing date") || near("application deadline") || near("applications close");
  const openingCtx = near("opening date") || near("applications open");

  const deadline = deadlineCtx ? (deadlineCtx.match(dateRe)?.[0] ?? null) : null;
  const opening = openingCtx ? (openingCtx.match(dateRe)?.[0] ?? null) : null;

  const requirementsCtx =
    near("minimum requirements") || near("admission requirements") || near("entry requirements");
  const documentsCtx =
    near("supporting documents") || near("required documents") || near("documents required");

  const found = [fee, deadline, opening, requirementsCtx, documentsCtx].filter(Boolean).length;
  // Deliberately low confidence — everything here is a candidate to review.
  const confidence = found === 0 ? 0 : Math.min(0.5, 0.15 * found);

  return {
    extracted_fee: fee,
    extracted_deadline: deadline,
    extracted_opening: opening,
    extracted_requirements: requirementsCtx ? requirementsCtx.slice(0, 400) : null,
    extracted_documents: documentsCtx ? documentsCtx.slice(0, 400) : null,
    confidence,
    hasCandidate: found > 0,
    snippet: (deadlineCtx || openingCtx || requirementsCtx || "").slice(0, 500) || null,
  };
}

async function checkSource(src) {
  const now = new Date().toISOString();
  let html = "";
  let httpStatus = null;
  let status = "ok";
  try {
    const res = await fetch(src.url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
    });
    httpStatus = res.status;
    if (!res.ok) status = "error";
    html = await res.text();
  } catch (e) {
    status = "error";
    console.warn(`  ! fetch failed for ${src.url}: ${e.message}`);
  }

  const text = toText(html);
  const hash = html ? createHash("sha256").update(text).digest("hex") : null;
  const changed = hash && src.content_hash && hash !== src.content_hash;
  if (changed) status = "changed";

  await supabase
    .from("programme_sources")
    .update({
      http_status: httpStatus,
      content_hash: hash ?? src.content_hash,
      last_checked: now,
      last_changed: changed ? now : src.last_changed,
      status,
      updated_at: now,
    })
    .eq("id", src.id);

  // Roll the check time up to the programme.
  await supabase
    .from("programmes")
    .update({ last_checked: now })
    .eq("id", src.programme_id);

  // Only try extraction on the first check or when the page changed.
  if (status === "error") return { status };
  if (src.content_hash && !changed) return { status };

  const ex = naiveExtract(text);
  if (ex.hasCandidate) {
    await supabase.from("programme_updates").insert({
      programme_id: src.programme_id,
      source_id: src.id,
      checked_at: now,
      extracted_text: ex.snippet,
      extracted_opening: ex.extracted_opening,
      extracted_deadline: ex.extracted_deadline,
      extracted_fee: ex.extracted_fee,
      extracted_requirements: ex.extracted_requirements,
      extracted_documents: ex.extracted_documents,
      confidence: ex.confidence,
      needs_review: true,
      review_status: "pending",
    });
    await supabase
      .from("programmes")
      .update({ needs_review: true })
      .eq("id", src.programme_id);
    return { status, queued: true };
  }
  return { status };
}

async function main() {
  console.log("Phapano+ programme refresher — starting.");
  const { data: sources, error } = await supabase
    .from("programme_sources")
    .select("*")
    .order("last_checked", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("Could not load programme_sources:", error.message);
    process.exit(1);
  }
  if (!sources?.length) {
    console.log("No sources to check. Seed programme_sources first.");
    return;
  }

  let queued = 0;
  let changed = 0;
  let errors = 0;
  for (const src of sources) {
    console.log(`Checking ${src.url}`);
    const r = await checkSource(src);
    if (r.queued) queued++;
    if (r.status === "changed") changed++;
    if (r.status === "error") errors++;
    await sleep(POLITE_DELAY_MS);
  }

  console.log(
    `Done. ${sources.length} sources checked · ${changed} changed · ${queued} candidate updates queued · ${errors} errors.`
  );
  console.log(
    "Review queued candidates in `programme_updates` (review_status = 'pending'), " +
      "then publish approved values to `programmes` and set last_verified."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
