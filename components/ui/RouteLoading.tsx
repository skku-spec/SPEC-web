type SkeletonProps = {
  className: string;
};

function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-[#16140f]/8 ${className}`} />;
}

export function ListPageLoading({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="min-h-screen px-4 pb-24 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-12 w-full max-w-[440px]" />
          <Skeleton className="h-5 w-full max-w-[560px]" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, index) => (
            <div key={index} className="rounded-lg border border-[#16140f]/8 bg-white/80 p-6 shadow-sm">
              <Skeleton className="mb-5 h-12 w-12 rounded-lg" />
              <Skeleton className="mb-3 h-7 w-2/3" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-6 h-4 w-4/5" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailPageLoading({ sidebar = false }: { sidebar?: boolean }) {
  return (
    <div className="min-h-screen px-4 pb-24 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <Skeleton className="h-4 w-40 rounded-full" />
        <div className={`flex flex-col gap-10 ${sidebar ? "lg:flex-row lg:gap-14" : ""}`}>
          <div className="min-w-0 flex-1 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full max-w-[520px]" />
              <Skeleton className="h-5 w-full max-w-[420px]" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-[280px] w-full rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
          {sidebar ? (
            <div className="w-full shrink-0 space-y-5 lg:w-[300px]">
              <Skeleton className="h-[220px] w-full rounded-lg" />
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FormPageLoading() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto max-w-[820px] space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-12 w-full max-w-[420px]" />
          <Skeleton className="h-5 w-full max-w-[520px]" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
          <Skeleton className="h-2 flex-1 rounded-full" />
        </div>

        <div className="rounded-lg border border-[#16140f]/8 bg-white/80 p-6 shadow-sm md:p-8">
          <div className="space-y-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-14 flex-1 rounded-full" />
              <Skeleton className="h-14 flex-1 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPageLoading() {
  return (
    <div className="min-h-screen px-4 pb-24 pt-12 md:px-8 md:pt-16">
      <div className="mx-auto max-w-[1120px] space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-11 w-full max-w-[360px]" />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>

        <Skeleton className="h-[360px] w-full rounded-lg" />
      </div>
    </div>
  );
}
