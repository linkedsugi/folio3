"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Container, LinkButton } from "./ui";
import { useAnalyses, useCredits, useHydrated } from "@/lib/useStorage";

const NAV = [
  { href: "/analyze", label: "분석하기" },
  { href: "/history", label: "내 공고" },
  { href: "/method", label: "판단 방식" },
  { href: "/pricing", label: "요금" },
];

function CreditChip() {
  const hydrated = useHydrated();
  const c = useCredits();
  const n = useAnalyses().filter((a) => a.mode !== "demo").length;
  if (!hydrated) return null;
  const label = !c.firstFreeUsed ? "첫 분석 무료" : `베타 크레딧 ${c.beta}${n ? ` · 분석 ${n}건` : ""}`;
  return (
    <Link
      href="/pricing"
      className="hidden rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-2 hover:bg-paper-2 sm:inline-flex"
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const hideOn = pathname?.match(/^\/result\/[^/]+\/resume$/);
  if (hideOn) return null;

  return (
    <header
      className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <Container className="flex h-14 items-center justify-between gap-3">
        <Link href="/" className="flex items-baseline gap-1 text-[17px] font-black tracking-tight text-ink">
          RoleFit<span className="font-medium text-muted">Canvas</span>
          <span className="ml-1.5 hidden rounded bg-paper-2 px-1.5 py-0.5 text-[10px] font-bold text-muted sm:inline" title="베타 · 후기 수집 전">베타</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname?.startsWith(n.href) ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${pathname?.startsWith(n.href) ? "bg-paper-2 text-ink font-semibold" : "text-ink-2 hover:bg-paper-2"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <CreditChip />
          <LinkButton href="/analyze" size="sm" className="max-sm:hidden">새 분석</LinkButton>
          <button
            type="button"
            aria-label="메뉴"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 hover:bg-paper-2 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </Container>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-paper md:hidden">
          <Container className="flex flex-col py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={close} className="rounded-md px-2 py-3 text-sm font-medium text-ink hover:bg-paper-2">
                {n.label}
              </Link>
            ))}
            <Link href="/analyze" onClick={close} className="mt-1 rounded-md bg-ink px-2 py-3 text-center text-sm font-semibold text-white">새 분석</Link>
          </Container>
        </div>
      )}
    </header>
  );
}
