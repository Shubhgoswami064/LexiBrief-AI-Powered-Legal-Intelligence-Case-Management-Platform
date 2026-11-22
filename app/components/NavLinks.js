"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/judgments", label: "All judgments" },
  { href: "/hearings", label: "Hearings" },
  { href: "/upload", label: "Upload judgment" },
];

export default function NavLinks({ horizontal = false }) {
  const pathname = usePathname();

  return (
    <ul className={horizontal ? "flex gap-1 overflow-x-auto text-sm" : "space-y-1 text-sm"}>
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const base = horizontal
          ? "block whitespace-nowrap border-b-2 px-3 py-2.5 transition"
          : "block border-l-2 py-2 pl-3 transition";
        const state = active
          ? "border-brass text-white"
          : "border-transparent text-white/70 hover:text-white";
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${base} ${state}`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}