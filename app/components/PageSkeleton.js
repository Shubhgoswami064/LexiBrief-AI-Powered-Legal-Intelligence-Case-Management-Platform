export default function PageSkeleton() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]" aria-busy="true">
      <div className="hidden bg-ink lg:block" />
      <main className="px-6 py-8 lg:px-12 lg:py-12">
        <p className="sr-only" role="status">
          Loading
        </p>
        <div className="animate-pulse" aria-hidden="true">
          <div className="h-8 w-64 max-w-full rounded bg-rule" />
          <div className="mt-4 h-4 w-96 max-w-full rounded bg-rule" />

          <div className="mt-10 grid grid-cols-2 gap-px border-y border-rule bg-rule lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-paper px-6 py-5">
                <div className="h-3 w-20 rounded bg-rule" />
                <div className="mt-3 h-7 w-12 rounded bg-rule" />
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-2/3 max-w-xl rounded bg-rule" />
                <div className="h-3 w-1/2 max-w-md rounded bg-rule" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}