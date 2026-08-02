export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl animate-pulse px-4 pb-12 pt-7 sm:px-6" aria-label="Loading Today">
      <div className="h-5 w-40 rounded-full bg-line-soft" />
      <div className="mt-3 h-9 w-56 rounded-full bg-line-soft" />
      <div className="mt-7 grid grid-cols-3 gap-3">
        <div className="h-24 rounded-card border border-line bg-white" />
        <div className="h-24 rounded-card border border-line bg-white" />
        <div className="h-24 rounded-card border border-line bg-white" />
      </div>
      <div className="mt-5 h-40 rounded-card border border-line bg-white" />
    </main>
  );
}
