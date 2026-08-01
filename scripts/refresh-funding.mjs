/**
 * Phapano+ official funding-source monitor.
 *
 * Fetches only source URLs already approved in funding_opportunities. It
 * records availability and content hashes, then queues changed facts for an
 * administrator to review. It deliberately never edits a public deadline,
 * eligibility rule, award value or open/closed state.
 *
 * Required server-only environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POLITE_DELAY_MS = Math.max(750, Number(process.env.FUNDING_CRAWL_DELAY_MS ?? 2200));
const MAX_SOURCES = Math.max(1, Number(process.env.FUNDING_MAX_SOURCES ?? 60));
const USER_AGENT =
  "PhapanoPlusFundingMonitor/1.0 (+https://phapano.com; info@phapano.com)";

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function candidateSignals(text) {
  const lower = text.toLowerCase();
  const context = (...terms) => {
    for (const term of terms) {
      const index = lower.indexOf(term);
      if (index >= 0) return text.slice(Math.max(0, index - 60), index + 320);
    }
    return null;
  };
  const datePattern =
    /\b(?:\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i;
  const deadlineContext = context(
    "closing date",
    "applications close",
    "application deadline",
    "deadline"
  );
  const openingContext = context("applications open", "opening date", "opens on");
  const amountContext = context("award value", "value of the award", "funding amount", "up to r");
  const amount =
    amountContext?.match(/\b(?:R|ZAR|US\$|USD)\s?[\d][\d ,.]{1,12}/i)?.[0] ?? null;
  const openState = /applications? (?:are |is )?(?:now )?open\b/i.test(text)
    ? "open"
    : /applications? (?:are |is )?(?:now )?closed\b/i.test(text)
      ? "closed"
      : null;
  const extracted = {
    deadline: deadlineContext?.match(datePattern)?.[0] ?? null,
    opening: openingContext?.match(datePattern)?.[0] ?? null,
    amount,
    open_state: openState,
    deadline_context: deadlineContext,
    opening_context: openingContext,
    amount_context: amountContext,
  };
  const factCount = [extracted.deadline, extracted.opening, amount, openState].filter(Boolean).length;
  return { extracted, confidence: Math.min(0.48, factCount * 0.12) };
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchOfficialSource(url) {
  const response = await fetch(url, {
    headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
  });
  const html = await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status}`), { httpStatus: response.status });
  }
  const text = cleanText(html);
  if (text.length < 100) throw new Error("Official page returned too little readable content");
  return {
    httpStatus: response.status,
    hash: createHash("sha256").update(text).digest("hex"),
    text,
  };
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: rows, error } = await supabase
    .from("funding_opportunities")
    .select("id,title,source_url,source_hash,last_changed_at")
    .eq("is_published", true)
    .not("source_url", "is", null)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(MAX_SOURCES);

  if (error) throw new Error(`Could not load funding sources: ${error.message}`);
  if (!rows?.length) {
    console.log("No published official funding sources to check.");
    return;
  }

  const now = new Date().toISOString();
  let checked = 0;
  let changed = 0;
  let queued = 0;
  let failed = 0;

  for (const row of rows) {
    console.log(`Checking ${row.title}: ${row.source_url}`);
    try {
      const page = await fetchOfficialSource(row.source_url);
      const isChanged = Boolean(row.source_hash && row.source_hash !== page.hash);
      const { extracted, confidence } = candidateSignals(page.text);

      const { error: updateError } = await supabase
        .from("funding_opportunities")
        .update({
          source_hash: page.hash,
          source_http_status: page.httpStatus,
          source_check_status: isChanged ? "changed" : "ok",
          last_checked_at: now,
          last_changed_at: isChanged ? now : row.last_changed_at,
          needs_review: isChanged,
        })
        .eq("id", row.id);
      if (updateError) throw updateError;

      // A first crawl establishes the baseline. Only later changes enter the
      // review queue, and no extracted value is written to the public fields.
      if (isChanged) {
        const { error: queueError } = await supabase.from("funding_updates").insert({
          funding_id: row.id,
          checked_at: now,
          source_url: row.source_url,
          source_hash: page.hash,
          extracted,
          confidence,
          change_summary: "The official source changed. Review extracted candidates against the page.",
          review_status: "pending",
        });
        if (queueError && queueError.code !== "23505") throw queueError;
        queued += 1;
        changed += 1;
      }
      checked += 1;
    } catch (cause) {
      failed += 1;
      const httpStatus = typeof cause?.httpStatus === "number" ? cause.httpStatus : null;
      console.warn(`  Could not check source: ${cause instanceof Error ? cause.message : cause}`);
      await supabase
        .from("funding_opportunities")
        .update({
          source_http_status: httpStatus,
          source_check_status: "error",
          last_checked_at: now,
        })
        .eq("id", row.id);
    }
    await sleep(POLITE_DELAY_MS);
  }

  console.log(
    `Funding refresh complete: ${checked} checked · ${changed} changed · ${queued} queued for review · ${failed} errors.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

