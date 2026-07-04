function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[#ddd9cc] bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-[#ece8dc]" />
        <div className="h-6 w-12 animate-pulse rounded bg-[#ece8dc]" />
      </div>
      <div className="mb-5 flex gap-5">
        <div className="h-14 w-20 animate-pulse rounded bg-[#f0efe6]" />
        <div className="h-14 w-20 animate-pulse rounded bg-[#f0efe6]" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="h-8 w-8 animate-pulse rounded-md bg-[#f0efe6]" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 pb-10">
      <div>
        <div className="h-12 w-72 animate-pulse rounded bg-[#ece8dc]" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[#ece8dc]" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="h-20 animate-pulse rounded-lg border border-[#ddd9cc] bg-[#fcfcf8]" />
    </section>
  );
}
