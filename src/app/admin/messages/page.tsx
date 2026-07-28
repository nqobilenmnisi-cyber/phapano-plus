import { requireAdmin } from "@/lib/admin";
import { MessagesList } from "@/components/AdminMessages";
import type { ContactMessage } from "@/types/database";

export const metadata = { title: "Messages — Phapano+ Admin" };

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireAdmin();
  const query = await searchParams;
  const status = query.status === "handled" ? "handled" : "new";

  let messages: ContactMessage[] = [];
  if (!ctx.demo) {
    const { data } = await ctx.supabase
      .from("contact_messages")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);
    messages = (data ?? []) as ContactMessage[];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <h1 className="pt-8 font-sora text-2xl font-bold tracking-tight">
        Contact messages
      </h1>
      <p className="mt-2 text-sm text-charcoal-soft">
        Enquiries from the contact form. Only admins can read these.
      </p>
      {ctx.demo ? (
        <p className="mt-6 text-sm text-charcoal-soft">
          Messages are available once Supabase is connected.
        </p>
      ) : (
        <MessagesList messages={messages} status={status} />
      )}
    </main>
  );
}
