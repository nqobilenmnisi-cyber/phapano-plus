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
    const { error } = await supabase
      .from("saved_funding")
      .delete()
      .eq("user_id", user.id)
      .eq("funding_id", fundingId);
    if (error) return { ok: false, error: "We couldn't update your saved funding. Please try again." };
  } else {
    const { error } = await supabase
      .from("saved_funding")
      .insert({ user_id: user.id, funding_id: fundingId });
    if (error) return { ok: false, error: "We couldn't update your saved funding. Please try again." };
  }
  revalidatePath("/app/funding");
  revalidatePath("/dashboard");
  return { ok: true };
}
