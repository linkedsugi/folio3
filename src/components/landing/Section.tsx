import type { ReactNode } from "react";
import { Container, SectionLabel } from "@/components/ui";

/** 섹션 머리말 — 라벨 · 제목 · 한 문단 */
export function Heading({
  label,
  title,
  lead,
  as: Tag = "h2",
  className = "",
}: {
  label?: string;
  title: ReactNode;
  lead?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const size = Tag === "h1" ? "text-3xl sm:text-4xl" : Tag === "h2" ? "text-2xl sm:text-3xl" : "text-lg";
  return (
    <div className={`max-w-2xl ${className}`}>
      {label && <SectionLabel>{label}</SectionLabel>}
      <Tag className={`mt-2 font-bold tracking-tight text-ink text-balance ${size}`}>{title}</Tag>
      {lead && <p className="mt-3 text-[15px] leading-7 text-ink-2">{lead}</p>}
    </div>
  );
}

/** 랜딩 섹션 — 전체 폭 배경 + Container */
export function Section({
  id,
  label,
  title,
  lead,
  tone = "paper",
  children,
}: {
  id?: string;
  label?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "paper" | "alt";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-14 sm:py-20 ${tone === "alt" ? "border-y border-line bg-paper-2/50" : ""}`}
    >
      <Container>
        <Heading label={label} title={title} lead={lead} />
        <div className="mt-8 sm:mt-10">{children}</div>
      </Container>
    </section>
  );
}

/** 강조 상자 — 냉정함의 규칙 등 */
export function Callout({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <aside className={`rounded-card border border-accent/30 bg-accent-soft/60 px-5 py-4 sm:flex sm:items-start sm:gap-5 ${className}`}>
      <div className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-accent sm:w-28 sm:pt-1">{label}</div>
      <div className="mt-1.5 text-[15px] leading-7 text-ink sm:mt-0">{children}</div>
    </aside>
  );
}

/** 흐름 화살표 — 좁은 화면에서는 아래로, md 이상에서는 옆으로 */
export function FlowArrow({ vertical = false, className = "" }: { vertical?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-center text-faint ${className}`} aria-hidden>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={vertical ? "rotate-90" : "rotate-90 md:rotate-0"}
      >
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    </div>
  );
}
