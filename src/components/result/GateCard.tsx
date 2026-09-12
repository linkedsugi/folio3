"use client";

import Link from "next/link";
import { useState } from "react";
import type { Analysis } from "@/lib/types";
import type { CreditState } from "@/lib/storage";
import { won } from "@/lib/copy";
import { Button, btnClass } from "../ui";

export function GateCard({
  analysis,
  credits,
  onUnlock,
}: {
  analysis: Analysis;
  credits: CreditState;
  onUnlock: () => void;
}) {
  const [open, setOpen] = useState(false);
  const candidates = analysis.basicResume.matches.filter((m) => m.level !== "met").length;
  const total = analysis.managerView.items.length;
  const available = credits.purchased + credits.beta;

  return (
    <section id="gate" className="card scroll-mt-28 border-2 border-dashed border-line-2 p-5 sm:p-7">
      <div className="inline-flex items-center rounded-md bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">결과물 2-2 · 3 · 판정</div>
      <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">갈음 논증 상세 · 스토리보완 이력서 본문 · 목표 이력서 체크리스트 — 잠겨 있음</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">
        판정과 숫자는 위에서 그대로 볼 수 있습니다. 잠긴 것은 제출물입니다 — 항목별 논증 본문과 이력 원문 근거, 부서장이 읽고 싶은 순서로 재배열한 이력서 전문(복사·다운로드·인쇄), 그리고 네 갈래 보강 항목과 체크리스트·재분석입니다.
      </p>
      <p className="num mt-3 rounded-lg bg-paper px-4 py-3 text-sm text-ink">
        이 공고에서 갈음 후보로 식별된 항목: <b>{candidates}개</b> / 전체 {total}개
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-ink-2 sm:grid-cols-3">
        <li className="rounded-lg border border-line bg-paper px-3 py-2.5">갈음 논증마다 붙는 이력 원문 근거와 논증 본문</li>
        <li className="rounded-lg border border-line bg-paper px-3 py-2.5">제출용 스토리보완 이력서 전문 · 복사 · 다운로드 · 인쇄</li>
        <li className="rounded-lg border border-line bg-paper px-3 py-2.5">목표 이력서 네 갈래 항목 · 체크리스트 · 보강 후 재분석</li>
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setOpen(true)} disabled={available <= 0}>
          {available > 0 ? `베타 크레딧으로 열기 (남은 ${available}개)` : "베타 크레딧 없음"}
        </Button>
        <Link href="/pricing" className={btnClass("secondary")}>공고 1건 {won(3900)} · 출시 예정가</Link>
      </div>
      {available <= 0 && (
        <p className="mt-3 text-sm leading-6 text-muted">
          베타 크레딧을 모두 사용했습니다. 결제가 열리기 전까지는 더 열 수 없습니다. 이미 연 공고의 재분석은 계속 가능합니다.
        </p>
      )}
      <p className="mt-3 text-xs leading-5 text-muted">첫 공고는 무료였습니다. 두 번째 공고부터는 크레딧이 필요하지만, 결제는 아직 연동되지 않았습니다 (브라우저당 베타 크레딧 3개, 자동 충전 없음).</p>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unlock-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-md p-6">
            <h3 id="unlock-title" className="text-lg font-bold text-ink">결제는 아직 연동되지 않았습니다</h3>
            <p className="mt-2 text-sm leading-6 text-ink-2">지금은 베타 기간입니다. 결제 없이 베타 크레딧으로 열 수 있습니다.</p>
            <dl className="num mt-3 grid grid-cols-2 gap-y-1 rounded-lg bg-paper px-4 py-3 text-sm">
              <dt className="text-muted">남은 베타 크레딧</dt><dd className="text-right font-semibold text-ink">{available}개</dd>
              <dt className="text-muted">출시 예정가</dt><dd className="text-right font-semibold text-ink">공고 1건 {won(3900)}</dd>
            </dl>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>닫기</Button>
              <Link href="/pricing" className={btnClass("secondary")}>가격 안내 보기</Link>
              <Button
                type="button"
                autoFocus
                onClick={() => {
                  setOpen(false);
                  onUnlock();
                }}
              >
                베타 크레딧으로 열기
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
