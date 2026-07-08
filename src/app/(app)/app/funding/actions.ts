"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function toggleSaveFunding(fundingId: string, saved: boolean) {
  if (!isSupabaseConfigured) return { ok: false, demo: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (saved) {
    await supabase
      .from("saved_funding")
      .delete()
      .eq("user_id", user.id)
      .eq("funding_id", fundingId);
  } else {
    await supabase
      .from("saved_funding")
      .insert({ user_id: user.id, funding_id: fundingId });
  }
  revalidatePath("/app/funding");
  revalidatePath("/dashboard");
  return { ok: true };
}
