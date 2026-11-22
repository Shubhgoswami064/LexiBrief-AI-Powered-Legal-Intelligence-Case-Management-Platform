import { signOut } from "../../auth";
import Brand from "./Brand";
import NavLinks from "./NavLinks";

export default function Sidebar({ name, roleLabel }) {
  return (
    <aside className="ruled relative flex flex-wrap items-center justify-between gap-y-1 bg-ink px-6 pt-4 text-white lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-start lg:px-8 lg:py-8">
      <Brand tone="light" />

      <nav aria-label="Main" className="order-last w-full lg:order-none lg:mt-14 lg:w-auto">
        <div className="lg:hidden">
          <NavLinks horizontal />
        </div>
        <div className="hidden lg:block">
          <NavLinks />
        </div>
      </nav>

      <div className="text-sm lg:mt-auto">
        <p className="hidden font-medium lg:block">{name}</p>
        <p className="mb-3 hidden text-white/60 lg:block">{roleLabel}</p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-white/70 underline-offset-4 transition hover:text-white hover:underline">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}