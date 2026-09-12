import { STAGES, type StageId } from "@/lib/types";
import { Callout } from "./Section";

const DETAIL: Record<StageId, { what: string; why: string }> = {
  manager: {
    what: "JD 항목 목록을 뽑는 부서장이 원하는 한 사람의 역할로 복원합니다.",
    why: "JD는 한 사람이 해낼 실제 역할을 항목으로 해체해 놓은 문서이기 때문입니다.",
  },
  basic: {
    what: "내 이력을 그대로 놓고 항목별 충족 · 부분 · 미충족을 매깁니다 (예 60%).",
    why: "출발점을 숨기지 않아야 어디를 채워야 하는지 보이기 때문입니다.",
  },
  story: {
    what: "부서장이 항목으로 담보하려던 능력을 내 다른 경험으로 갈음할 수 있는지 논증하고, 이력 속 근거를 붙입니다 (샘플 72%).",
    why: "부서장은 항목이 아니라 그 역할을 해낼 사람을 찾기 때문입니다.",
  },
  target: {
    what: "합격선 80% 기준으로 지원 · 보류 · 비추천을 내리고, 못 미치면 네 갈래 보강 로드맵을 줍니다.",
    why: "80%가 희망이 아니라 판단이어야 하기 때문입니다.",
  },
};

export function ColdRule({ className = "" }: { className?: string }) {
  return (
    <Callout label="냉정함의 규칙" className={className}>
      갈음 주장마다 이력 속 실제 경험이 근거로 붙어야 합니다. 근거 없는 주장은 점수에 반영하지 않습니다 — 그래야 80%가 희망이
      아니라 판단이 됩니다.
    </Callout>
  );
}

export function Pipeline() {
  return (
    <div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAGES.map((s, i) => {
          const d = DETAIL[s.id];
          return (
            <li key={s.id} className="card relative flex flex-col p-5">
              <div className="num text-xs font-bold tracking-[0.14em] text-accent">0{i + 1}</div>
              <h3 className="mt-2 text-base font-bold leading-6 text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-2">{d.what}</p>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">
                <span className="font-semibold text-ink-2">왜 · </span>
                {d.why}
              </p>
            </li>
          );
        })}
      </ol>
      <ColdRule className="mt-6" />
    </div>
  );
}
