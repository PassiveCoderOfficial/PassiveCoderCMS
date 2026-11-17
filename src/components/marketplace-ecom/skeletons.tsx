/**
 * Loading placeholders shaped like the real pages, so content drops in
 * without layout shift. Theme tokens only (bg-muted), so any store's palette
 * applies; marketplace stores get their own tokens from the layout.
 */
const B = "bg-muted rounded-md animate-pulse motion-reduce:animate-none";

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/60">
          <div className={`${B} rounded-none aspect-square`} />
          <div className="p-2.5 space-y-2">
            <div className={`${B} h-3 w-11/12`} />
            <div className={`${B} h-3 w-2/3`} />
            <div className={`${B} h-4 w-1/3 mt-3`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 sm:pt-4 pb-10 space-y-3" role="status" aria-label="Loading products">
      <div className={`${B} h-10 rounded-xl`} />
      <div className="grid lg:grid-cols-[220px_1fr] gap-4 items-start">
        <div className={`${B} hidden lg:block h-96 rounded-xl`} />
        <div className="space-y-3">
          <div className={`${B} h-6 w-48`} />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto sm:px-4 sm:pt-4 pb-10 space-y-4" role="status" aria-label="Loading product">
      <div className="bg-card sm:rounded-2xl grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 md:gap-8 md:p-6">
        <div className={`${B} aspect-square rounded-none sm:rounded-2xl`} />
        <div className="px-4 pb-4 md:p-0 space-y-4">
          <div className={`${B} h-7 w-4/5`} />
          <div className={`${B} h-4 w-1/3`} />
          <div className={`${B} h-16 rounded-xl`} />
          <div className={`${B} h-4 w-2/3`} />
          <div className={`${B} h-4 w-1/2`} />
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`${B} h-10 w-16 rounded-lg`} />)}
          </div>
          <div className="hidden md:flex gap-3 pt-2">
            <div className={`${B} h-12 flex-1 rounded-xl`} />
            <div className={`${B} h-12 flex-1 rounded-xl`} />
          </div>
        </div>
      </div>
      <div className={`${B} h-40 sm:rounded-2xl rounded-none`} />
    </div>
  );
}
