export default function AppRouteLoading() {
  return (
    <main className="mx-auto max-w-3xl animate-pulse px-4 pb-12 pt-7 sm:px-6" aria-label="Loading page">
      <div className="h-8 w-40 rounded-full bg-line-soft" />
      <div className="mt-3 h-4 w-3/4 rounded-full bg-line-soft" />
      <div className="mt-7 space-y-4">
        <div className="h-32 rounded-card border border-line bg-white" />
        <div className="h-44 rounded-card border border-line bg-white" />
        <div className="h-28 rounded-card border border-line bg-white" />
      </div>
    </main>
  );
}
