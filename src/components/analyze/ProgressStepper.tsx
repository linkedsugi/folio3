"use client";

import { useEffect, useState } from "react";
import { STAGES, type StageId } from "@/lib/types";

export type StageState = "idle" | "running" | "done";

const LINES: Record<StageId, { running: string; why: string; done: string }> = {
  manager: {
    running: "JD 항목을 하나씩 떼어보지 않고, 이 부서의 실제 일 하나를 찾고 있습니다.",
    why: "\"경력 5년\"이 정말 5년을 원하는 건지, 다른 능력의 표지인지 읽습니다.",
    done: "부서장이 뽑으려는 사람을 복원했습니다.",
  },
  basic: {
    running: "JD 요소별로 내 스펙이 액면으로 얼마나 대응되는지 표시합니다.",
    why: "이 숫자는 낮게 나오는 게 정상입니다. 시작점일 뿐입니다.",
    done: "기본 이력서 · 액면 충족률 산출 완료",
  },
  story: {
    running: "항목을 못 채워도 그 능력을 다른 경험으로 갈음할 수 있는지, 이력 속 실제 경험을 근거로 찾고 있습니다.",
    why: "근거가 없는 주장은 점수에 넣지 않습니다. 그래야 80%가 희망이 아니라 판단이 됩니다.",
    done: "스토리보완 이력서 작성 완료",
  },
  target: {
    running: "부족한 부분을 네 갈래로 나눠 무엇을 발굴·보완·학습해야 하는지 정리합니다.",
    why: "단기간에 대체 어려운 요건은 숨기지 않고 미충족으로 표시합니다.",
    done: "목표 이력서와 판정이 준비됐습니다.",
  },
};

function useElapsed(): number {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setSec(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  return sec;
}

export function ProgressStepper({
  stages,
  previews,
  demo,
  title,
}: {
  stages: Record<StageId, StageState>;
  previews: Partial<Record<StageId, string>>;
  demo: boolean;
  title?: string;
}) {
  const current = STAGES.find((s) => stages[s.id] === "running") ?? STAGES.find((s) => stages[s.id] === "idle");
  const sec = useElapsed();
  const mm = String(Math.floor(sec / 60));
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <div className="card p-6 sm:p-8" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">{demo ? "샘플 분석 중" : title ? `〈${title}〉 판단 중` : "부서장의 눈으로 분석 중"}</div>
        <div className="num text-xs text-muted" aria-label="경과 시간">경과 {mm}:{ss}</div>
      </div>
      <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{current ? current.title : "마무리하는 중"}</h1>
      <ol className="mt-6 space-y-5">
        {STAGES.map((s, i) => {
          const st = stages[s.id];
          const line = LINES[s.id];
          return (
            <li key={s.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    st === "done" ? "bg-ink text-white" : st === "running" ? "bg-accent text-white" : "border border-line-2 bg-paper text-muted"
                  }`}
                  aria-hidden
                >
                  {st === "done" ? "✓" : i + 1}
                </span>
                {i < STAGES.length - 1 && <span className={`mt-1 w-px flex-1 ${st === "done" ? "bg-ink" : "bg-line"}`} aria-hidden />}
              </div>
              <div className={`min-w-0 flex-1 pb-1 ${st === "idle" ? "opacity-50" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{s.title}</span>
                  {st === "running" && <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-accent" aria-label="진행 중" />}
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-2">
                  {st === "done" ? line.done : st === "running" ? line.running : s.caption}
                </p>
                {st === "running" && <p className="mt-0.5 text-xs leading-5 text-muted">{line.why}</p>}
                {st === "done" && previews[s.id] && <p className="rise mt-1.5 rounded-md bg-paper px-3 py-1.5 text-sm text-ink">{previews[s.id]}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 border-t border-line pt-4 text-xs leading-5 text-muted">
        완료될 때까지 이 탭을 유지해 주세요. 완료 후에는 브라우저에 자동 저장됩니다.{sec > 120 && " 긴 JD와 이력은 더 걸립니다."}
      </p>
    </div>
  );
}
