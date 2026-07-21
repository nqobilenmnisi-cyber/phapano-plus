"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ContactResult = { ok: true } | { error: string };

const CATEGORIES = new Set([
  "Ask a question",
  "Report incorrect information",
  "Suggest a funding opportunity",
  "Suggest a university or application update",
  "Explore a partnership",
  "Share a feature suggestion",
  "Get general support",
]);

export async function submitContactMessage(
  formData: FormData
): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  // Honeypot: bots fill hidden fields; humans never see this one.
  const trap = String(formData.get("company") ?? "").trim();

  if (trap) return { ok: true }; // silently drop bot submissions
  if (!name || name.length > 120)
    return { error: "Please enter your name." };
  if (!email || !email.includes("@") || email.length > 200)
    return { error: "Please enter a valid email address." };
  if (!CATEGORIES.has(category))
    return { error: "Please choose an enquiry type." };
  if (message.length < 10)
    return { error: "Please add a little more detail (at least 10 characters)." };
  if (message.length > 4000)
    return { error: "Please keep your message under 4000 characters." };

  if (!isSupabaseConfigured)
    return {
      error:
        "Messaging isn't available in this preview. Please email info@phapano.com directly.",
    };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    category,
    message,
    user_id: user?.id ?? null,
  });

  if (error) {
    if (error.message.includes("rate_limit_exceeded"))
      return {
        error:
          "You've sent several messages recently. Please wait a little while before sending another.",
      };
    return {
      error:
        "We couldn't send that just now. Please try again, or email info@phapano.com.",
    };
  }
  return { ok: true };
}
