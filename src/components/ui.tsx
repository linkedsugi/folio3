import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 shadow-sm",
  secondary: "bg-card text-ink border border-line-2 hover:bg-paper-2",
  ghost: "text-ink-2 hover:bg-paper-2",
  danger: "bg-card text-no border border-line-2 hover:bg-paper-2",
};
const sizes: Record<Size, string> = {
  sm: "text-[13px] h-9 px-3",
  md: "text-sm h-11 px-4",
  lg: "text-base h-13 px-6",
};

export function btnClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={btnClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string; variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={btnClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Pill({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "accent" | "apply" | "hold" | "no" | "warn"; className?: string }) {
  const tones = {
    neutral: "bg-paper-2 text-ink-2 border-line",
    accent: "bg-accent-soft text-accent border-transparent",
    apply: "bg-apply-soft text-apply border-transparent",
    hold: "bg-hold-soft text-hold border-transparent",
    no: "bg-no-soft text-no border-transparent",
    warn: "bg-[#fff3d6] text-[#7a4b00] border-transparent",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{children}</div>;
}
