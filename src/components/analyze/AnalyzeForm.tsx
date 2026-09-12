"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import { SAMPLE_STAGES } from "@/lib/sample";
import { REANALYSIS_INCLUDED, claimFirstFree, clearDraft, getAnalysis, getDraft, listAnalyses, newId, reanalysisCount, saveAnalysis, saveDraft } from "@/lib/storage";
import { useCredits, useHydrated } from "@/lib/useStorage";
import type { Analysis, AnalyzeEvent, StageId } from "@/lib/types";
import { Button, Pill, btnClass } from "../ui";
import { ProgressStepper, type StageState } from "./ProgressStepper";

type Phase = "input" | "running" | "error";

/**
 * 목표 이력서에서 사용자가 직접 적은 메모만 이력 뒤에 붙인다.
 * 체크만 한 항목(모델이 쓴 제목)은 붙이지 않는다 — 인용 근거로 오인될 수 있기 때문.
 */
function buildAugmentedResume(parent: Analysis): string {
  const lines: string[] = [];
  for (const g of parent.targetResume.gaps) {
    const note = parent.notes?.[g.id]?.trim();
    if (!note) continue;
    lines.push(`- ${note}`);
  }
  if (lines.length === 0) return parent.candidate.resumeText;
  return `${parent.candidate.resumeText}\n\n[보강 추가]\n${lines.join("\n")}`;
}

function isSampleText(jd: string, resume: string): boolean {
  return jd.trim() === SAMPLE_STAGES.posting.jdText.trim() && resume.trim() === SAMPLE_STAGES.candidate.resumeText.trim();
}

/** 하이드레이션 전에는 폼을 그리지 않는다 — 초기값이 브라우저 저장소에서 오기 때문 */
export function AnalyzeForm({ live, model }: { live: boolean; model: string | null }) {
  const hydrated = useHydrated();
  const search = useSearchParams();
  const fromId = search.get("from");
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse" aria-busy="true">
        <div className="h-8 w-64 rounded bg-paper-2" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card h-[420px]" />
          <div className="card h-[420px]" />
        </div>
      </div>
    );
  }
  return <FormInner key={fromId ?? "new"} live={live} model={model} fromId={fromId} />;
}

function FormInner({ live, model, fromId }: { live: boolean; model: string | null; fromId: string | null }) {
  const router = useRouter();
  const credits = useCredits();
  const firstFree = !credits.firstFreeUsed;

  // 초기값: 재분석이면 부모 공고, 아니면 임시 저장본 (클라이언트에서만 마운트되므로 안전)
  const [parent] = useState<Analysis | null>(() => (fromId ? getAnalysis(fromId) : null));
  const [company, setCompany] = useState(() => parent?.posting.company ?? getDraft()?.company ?? "");
  const [title, setTitle] = useState(() => parent?.posting.title ?? getDraft()?.title ?? "");
  const [jd, setJd] = useState(() => parent?.posting.jdText ?? getDraft()?.jdText ?? "");
  const [resume, setResume] = useState(() => (parent ? buildAugmentedResume(parent) : (getDraft()?.resumeText ?? "")));
  const [isSample, setIsSample] = useState(() => (parent ? parent.mode === "demo" : isSampleText(getDraft()?.jdText ?? "", getDraft()?.resumeText ?? "")));
  const [saveError, setSaveError] = useState<Analysis | null>(null);
  const reanalysesUsed = useMemo(() => (parent ? reanalysisCount(parent, listAnalyses()) : 0), [parent]);
  const [phase, setPhase] = useState<Phase>("input");
  const [stages, setStages] = useState<Record<StageId, StageState>>({ manager: "idle", basic: "idle", story: "idle", target: "idle" });
  const [previews, setPreviews] = useState<Partial<Record<StageId, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 입력 보존 (오류·이탈 대비). 샘플 텍스트는 저장하지 않는다
  useEffect(() => {
    if (parent || isSample) return;
    const t = setTimeout(() => saveDraft({ company, title, jdText: jd, resumeText: resume }), 400);
    return () => clearTimeout(t);
  }, [company, title, jd, resume, parent, isSample]);

  const fillSample = () => {
    setCompany(SAMPLE_STAGES.posting.company);
    setTitle(SAMPLE_STAGES.posting.title);
    setJd(SAMPLE_STAGES.posting.jdText);
    setResume(SAMPLE_STAGES.candidate.resumeText);
    setIsSample(true);
    setError(null);
  };

  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (!parent) setIsSample(false);
  };

  /** 재분석은 JD 가 그대로일 때만 같은 공고로 친다 (JD 를 바꾸면 새 공고) */
  const sameJd = Boolean(parent && jd.trim() === parent.posting.jdText.trim());
  /** 열림 상태 상속: 같은 공고 · 부모가 열려 있음 · 샘플이 아님 · 포함 재분석 횟수 이내 */
  const inheritUnlock = Boolean(parent && sameJd && parent.unlocked && parent.unlockedBy !== "sample" && reanalysesUsed < REANALYSIS_INCLUDED);

  const canSubmit = jd.trim().length >= 200 && resume.trim().length >= 150;
  const shortResume = resume.trim().length > 0 && resume.trim().length < 300;

  const run = async () => {
    setError(null);
    setSaveError(null);
    setPhase("running");
    setStages({ manager: "idle", basic: "idle", story: "idle", target: "idle" });
    setPreviews({});
    const id = newId();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, company, title, jdText: jd, resumeText: resume, demo: isSample, parentId: parent && sameJd ? parent.id : null }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `요청이 실패했습니다 (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let result: Analysis | null = null;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as AnalyzeEvent;
          if (ev.type === "stage") {
            setStages((s) => ({ ...s, [ev.stage]: ev.status === "start" ? "running" : "done" }));
          } else if (ev.type === "partial") {
            if (ev.stage === "manager") setPreviews((p) => ({ ...p, manager: `부서장이 뽑으려는 사람: ${ev.data.personProfile}` }));
            if (ev.stage === "basic") setPreviews((p) => ({ ...p, basic: `액면 충족률 ${ev.data.faceScore}% — 시작점일 뿐입니다` }));
            if (ev.stage === "story") {
              const nc = ev.data.arguments.filter((a) => a.evidenceStatus !== "grounded").length;
              setPreviews((p) => ({ ...p, story: `스토리보완 후 ${ev.data.storyScore}% · 근거 부족으로 미반영 ${nc}건` }));
            }
          } else if (ev.type === "result") {
            result = ev.data;
          } else if (ev.type === "error") {
            throw new Error(ev.message);
          }
        }
      }
      if (!result) throw new Error("결과를 받지 못했습니다.");

      // 저장 + 열림 처리: 샘플/데모는 항상 열림, 같은 공고 재분석은 부모 상태 상속(포함 횟수 이내),
      // 그 밖에는 첫 공고 무료 권리로만 자동으로 열린다. 크레딧은 GateCard 에서 사용자가 눌러야만 쓴다.
      let toSave: Analysis = result;
      if (result.mode === "demo") toSave = { ...result, unlocked: true, unlockedBy: "sample" };
      else if (inheritUnlock && parent) toSave = { ...result, unlocked: true, unlockedBy: parent.unlockedBy ?? "firstFree" };
      if (!saveAnalysis(toSave)) {
        setSaveError(toSave);
        setPhase("error");
        setError("브라우저 저장 공간이 부족해 결과를 저장하지 못했습니다. 내 공고에서 오래된 결과를 삭제한 뒤 다시 시도해 주세요. 입력은 그대로 남겨 두었습니다.");
        return;
      }
      if (!toSave.unlocked) claimFirstFree(toSave.id);
      clearDraft();
      router.push(`/result/${toSave.id}`);
    } catch (err) {
      if (ctrl.signal.aborted) {
        setPhase("input");
        return;
      }
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
      setPhase("error");
    }
  };

  const resumeLen = resume.trim().length;
  const jdLen = jd.trim().length;
  const lockedNext = useMemo(() => !firstFree && !parent && !isSample, [firstFree, parent, isSample]);

  if (phase === "running") {
    return (
      <div className="mx-auto max-w-2xl">
        <ProgressStepper stages={stages} previews={previews} demo={isSample} title={[company, title].filter(Boolean).join(" · ")} />
        <div className="mt-4 text-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>취소</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ink sm:text-3xl">{parent ? "보강 내용 반영해서 다시 분석" : "공고와 이력을 넣으세요"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          {parent
            ? "이전 공고의 JD는 그대로 두고, 목표 이력서에서 적은 답변과 메모가 이력 뒤에 [보강 추가] 블록으로 붙었습니다. 필요하면 고쳐서 다시 분석하세요."
            : "부서장의 자리에 서서 JD를 읽고, 내 이력을 그 사람의 상에 대조합니다. 형식은 상관없습니다."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {live ? (
            <Pill tone="apply">AI 분석 준비됨{model ? ` · ${model}` : ""}</Pill>
          ) : (
            <Pill tone="warn">데모 모드 · 서버에 API 키가 없어 샘플 공고만 분석됩니다</Pill>
          )}
          {parent ? (
            inheritUnlock ? (
              <Pill tone="accent">재분석 {reanalysesUsed + 1}/{REANALYSIS_INCLUDED} · 이전 결과의 열림 상태를 이어받습니다</Pill>
            ) : !sameJd ? (
              <Pill tone="neutral">JD 를 바꾸면 새 공고로 분석됩니다</Pill>
            ) : (
              <Pill tone="neutral">포함된 재분석 {REANALYSIS_INCLUDED}회를 모두 썼습니다 · 상세는 크레딧으로 엽니다</Pill>
            )
          ) : firstFree ? (
            <Pill tone="accent">첫 분석 무료 · 결과물 전부 열람</Pill>
          ) : (
            <Pill tone="neutral">두 번째 공고부터 판정과 숫자는 무료 · 이력서 본문과 로드맵은 크레딧</Pill>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-hold/30 bg-hold-soft p-4 text-sm leading-6 text-ink">
          <p className="font-semibold">분석이 중단됐습니다. 크레딧은 차감되지 않았습니다.</p>
          <p className="mt-1 text-ink-2">{error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => void run()}>다시 시도</Button>
            {saveError && (
              <>
                <Link href="/history" className={btnClass("secondary", "sm")}>내 공고에서 정리하기</Link>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void navigator.clipboard.writeText(saveError.storyResume.resumeMarkdown).catch(() => undefined)}
                >
                  스토리보완 이력서 복사해 두기
                </Button>
              </>
            )}
            {!live && !isSample && (
              <Button type="button" size="sm" variant="secondary" onClick={fillSample}>샘플로 체험하기</Button>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) void run();
        }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">A. 채용 공고 (JD)</h2>
            <span className="num text-xs text-muted">{jdLen.toLocaleString()}자</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              회사명 <span className="text-faint">(선택)</span>
              <input value={company} onChange={(e) => edit(setCompany)(e.target.value)} placeholder="예: Intel Korea" className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none" />
            </label>
            <label className="text-xs text-muted">
              직무명 <span className="text-faint">(선택)</span>
              <input value={title} onChange={(e) => edit(setTitle)(e.target.value)} placeholder="예: Gaming Application Engineer" className="mt-1 h-10 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none" />
            </label>
          </div>
          <label className="mt-3 block text-xs text-muted">
            공고 본문
            <textarea
              value={jd}
              onChange={(e) => edit(setJd)(e.target.value)}
              placeholder={COPY.input.jdPh}
              rows={12}
              required
              className="mt-1 w-full resize-y rounded-md border border-line bg-paper px-3 py-2.5 text-sm leading-6 text-ink placeholder:text-faint focus:border-accent focus:outline-none lg:min-h-[360px]"
            />
          </label>
          {jdLen > 0 && jdLen < 200 && <p className="mt-1 text-xs text-hold">공고 본문이 짧습니다 (200자 이상). 주요 업무·자격 요건·우대 사항을 모두 넣어 주세요.</p>}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ink">B. 내 이력 <span className="text-sm font-medium text-muted">(형식 무관)</span></h2>
            <span className="num text-xs text-muted">{resumeLen.toLocaleString()}자</span>
          </div>
          <label className="mt-3 block text-xs text-muted">
            이력 원문
            <textarea
              value={resume}
              onChange={(e) => edit(setResume)(e.target.value)}
              placeholder={COPY.input.resumePh}
              rows={14}
              required
              className="mt-1 w-full resize-y rounded-md border border-line bg-paper px-3 py-2.5 text-sm leading-6 text-ink placeholder:text-faint focus:border-accent focus:outline-none lg:min-h-[420px]"
            />
          </label>
          {resumeLen > 0 && resumeLen < 150 && <p className="mt-1 text-xs text-hold">이력이 너무 짧습니다 (150자 이상). 사소한 경험까지 전부 적어 주세요.</p>}
          {resumeLen >= 150 && shortResume && <p className="mt-1 text-xs leading-5 text-ink-2">{COPY.input.shortResume}</p>}
        </section>

        <div className="card flex flex-col gap-3 p-5 lg:col-span-2">
          <p className="text-xs leading-5 text-muted">{COPY.input.privacy}</p>
          {lockedNext && (
            <p className="rounded-md bg-paper px-3 py-2 text-xs leading-5 text-ink-2">
              첫 분석은 이미 쓰셨습니다. 이번 공고도 부서장 분석·액면 충족률·스토리보완 충족률·판정까지는 무료로 봅니다. 갈음 논증 본문·스토리보완 이력서 전문·목표 이력서 체크리스트는 베타 크레딧으로 열 수 있습니다 (결제는 아직 연동되지 않았습니다).
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={fillSample}>{COPY.input.fillSample}</Button>
              {isSample && <span className="text-xs text-muted">샘플이 채워졌습니다 · 분석 시 크레딧을 쓰지 않습니다</span>}
              {!isSample && !live && <span className="text-xs text-hold">API 키가 없어 내 공고는 분석되지 않습니다. 샘플로 흐름을 체험해 보세요.</span>}
            </div>
            <Button type="submit" size="lg" disabled={!canSubmit}>{parent ? "다시 분석하기" : COPY.input.submit}</Button>
          </div>
          <p className="text-xs text-muted">
            분석은 4단계로 순차 진행되며 완료될 때까지 이 탭을 유지해 주세요. 완료 후에는 브라우저에 자동 저장됩니다. 판정 방식이 궁금하면 <Link href="/method" className="text-accent hover:underline">판단 방식</Link>을 보세요.
          </p>
        </div>
      </form>

      {parent && (
        <p className="mt-4 text-sm text-muted">
          <Link href={`/result/${parent.id}`} className={btnClass("ghost", "sm")}>← 이전 결과로 돌아가기</Link>
        </p>
      )}
    </div>
  );
}
