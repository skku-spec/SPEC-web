export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 h-10 w-48 animate-pulse rounded-lg bg-[#e8e6dc]" />
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-lg border border-[#ddd9cc] bg-white" />
        <div className="h-64 animate-pulse rounded-lg border border-[#ddd9cc] bg-white" />
      </div>
    </div>
  );
}
