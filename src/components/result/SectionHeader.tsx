import type { ReactNode } from "react";

export function SectionHeader({
  id,
  number,
  title,
  lead,
  aside,
}: {
  id: string;
  number: string;
  title: string;
  lead?: string;
  aside?: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-28 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-1.5 inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">결과물 {number}</div>
        <h2 className="text-xl font-bold leading-snug text-ink sm:text-2xl">{title}</h2>
        {lead && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{lead}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
