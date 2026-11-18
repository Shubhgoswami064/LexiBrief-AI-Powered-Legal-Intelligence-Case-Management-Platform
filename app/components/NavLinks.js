"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/judgments", label: "All judgments" },
  { href: "/upload", label: "Upload judgment" },
  { href: "/hearings", label: "All hearings" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block border-l-2 py-2 pl-3 transition ${
                active
                  ? "border-brass text-white"
                  : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}