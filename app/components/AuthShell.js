import Brand from "./Brand";
import DistillVisual from "./DistillVisual";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="ruled relative hidden flex-col justify-between overflow-hidden bg-ink p-12 pl-16 text-white lg:flex">
        <Brand tone="light" />

        <div className="relative">
          <h2 className="max-w-md font-serif text-4xl leading-tight">
            Long judgments, read in minutes.
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Upload a judgment and get the summary, key legal points, citations and
            similar cases in one place.
          </p>
          <div className="mt-12">
            <DistillVisual />
          </div>
        </div>

        <p className="text-sm text-white/50">
          Summaries are AI-generated. Check them against the original judgment.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand tone="dark" />
          </div>
          <h1 className="font-serif text-3xl">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted">{footer}</div>
        </div>
      </section>
    </main>
  );
}