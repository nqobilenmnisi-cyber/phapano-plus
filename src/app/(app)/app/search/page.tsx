import { GlobalSearch } from "@/components/GlobalSearch";

export const metadata = { title: "Search | Phapano+" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q ?? "";
  return (
    <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
      <h1 className="font-sora text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        Find people, pages, posts and psychology pathway resources.
      </p>
      <div className="mt-5">
        <GlobalSearch initialQuery={query} expanded />
      </div>
    </main>
  );
}
