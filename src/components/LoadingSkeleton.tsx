export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-white/[0.04]" />
      <div className="p-3 space-y-2.5">
        <div className="h-4 bg-white/[0.06] rounded w-3/4" />
        <div className="h-3 bg-white/[0.04] rounded w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-white/[0.06] rounded w-14" />
          <div className="h-7 bg-white/[0.06] rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="section-padding py-8 animate-pulse">
      <div className="h-8 bg-white/[0.06] rounded-lg w-48 mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
