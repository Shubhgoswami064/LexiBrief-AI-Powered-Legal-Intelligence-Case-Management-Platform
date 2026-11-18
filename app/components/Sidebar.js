import { signOut } from "../../auth";
import Brand from "./Brand";
import NavLinks from "./NavLinks";

export default function Sidebar({ name, roleLabel }) {
  return (
    <aside className="ruled relative flex items-center justify-between bg-ink px-8 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:items-stretch lg:justify-start lg:py-8">
      <Brand tone="light" />

      <nav className="hidden lg:mt-14 lg:block">
        <NavLinks />
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