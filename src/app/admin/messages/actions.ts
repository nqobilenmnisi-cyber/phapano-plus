"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function markMessageHandled(
  id: string,
  handled: boolean
): Promise<{ ok: true } | { error: string }> {
  const ctx = await requireAdmin();
  if (ctx.demo) return { error: "Not available in demo mode." };
  const { error } = await ctx.supabase
    .from("contact_messages")
    .update({
      status: handled ? "handled" : "new",
      handled_by: handled ? ctx.user.id : null,
      handled_at: handled ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: "Couldn't update that message." };
  revalidatePath("/admin/messages");
  return { ok: true };
}
