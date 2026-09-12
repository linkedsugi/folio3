import { ScoreMeter } from "@/components/ScoreMeter";
import { VerdictBadge } from "@/components/VerdictBadge";
import { GAP_CATEGORY_META } from "@/lib/scoring";
import { PASS_LINE, type GapCategory } from "@/lib/types";
import { FlowArrow } from "./Section";

const JD_ITEMS = [
  "게임개발 경력 5년 이상",
  "C++ / 그래픽스 API 이해",
  "성능 프로파일링·최적화",
  "영어 기술 커뮤니케이션",
  "파트너사 관계 관리",
  "······",
];

function Tag({ children, tone = "muted" }: { children: string; tone?: "muted" | "accent" }) {
  return (
    <div className={`text-[11px] font-bold uppercase tracking-[0.14em] ${tone === "accent" ? "text-accent" : "text-muted"}`}>
      {children}
    </div>
  );
}

/** 통찰 1 — 부서장은 역할을 항목으로 해체하고, 앱은 항목에서 사람을 복원한다 */
export function RoleDiagram() {
  return (
    <figure className="card p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <div className="rounded-lg border border-line bg-paper-2/50 p-4">
          <Tag>JD 항목 — 부서장이 쓴 것</Tag>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {JD_ITEMS.map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border border-line-2 bg-card" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center gap-4 text-xs md:w-48 md:text-center">
          <div className="flex items-center gap-3 md:flex-col md:gap-1">
            <span className="text-xl leading-none text-faint" aria-hidden>
              <span className="md:hidden">↑</span>
              <span className="hidden md:inline">←</span>
            </span>
            <span className="text-muted">
              <span className="block font-semibold text-ink-2">부서장이 쓰는 방향</span>
              역할을 항목으로 해체
            </span>
          </div>
          <div className="flex items-center gap-3 md:flex-col md:gap-1">
            <span className="text-xl leading-none text-accent" aria-hidden>
              <span className="md:hidden">↓</span>
              <span className="hidden md:inline">→</span>
            </span>
            <span className="text-accent">
              <span className="block font-semibold">앱이 읽는 방향</span>
              항목에서 사람을 복원
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-lg border border-accent/30 bg-accent-soft/50 p-4">
          <Tag tone="accent">부서장이 원하는 한 사람</Tag>
          <p className="mt-3 text-base font-bold leading-7 text-ink">게임사 엔지니어와 막힘없이 기술협력을 해내는 AE</p>
        </div>
      </div>
      <figcaption className="mt-4 text-xs leading-5 text-muted">
        인텔 게이밍 AE 채용 예시. 「게임개발 경력 5년」은 숫자가 목적이 아니라, 게임사 핵심 엔지니어와 막힘없이 기술 대화를 나눌
        사람을 원한 것입니다.
      </figcaption>
    </figure>
  );
}

const FLOW = [
  { tag: "입력", title: "JD + 내 이력", desc: "공고 원문과 이력을 그대로 넣습니다. 사소해 보이는 경험도 근거가 됩니다." },
  { tag: "결과물 1", title: "부서장이 뽑으려는 사람", desc: "항목 목록에서 실제 일과 사람의 상을 복원합니다." },
  { tag: "결과물 2-1", title: "기본 이력서 · 액면 충족률", desc: "내 이력을 항목에 그대로 대응합니다. 예 60%." },
  {
    tag: "결과물 2-2",
    title: "스토리보완 이력서 · 갈음 논증 + 근거",
    desc: "부서장이 담보하려던 능력을 내 다른 경험으로 갈음하고, 이력 속 근거를 붙입니다. 예 80%.",
  },
] as const;

/** 통찰 2 — 파이프라인과 합격선 판정 */
export function PipelineDiagram() {
  return (
    <div className="space-y-6">
      <figure className="card p-5 sm:p-6">
        <ol className="relative space-y-3 border-l border-line-2 pl-6">
          {FLOW.map((s) => (
            <li key={s.tag} className="relative">
              <span className="absolute -left-[29px] top-2 inline-block h-2 w-2 rounded-full bg-faint" aria-hidden />
              <div className="rounded-lg border border-line bg-paper-2/40 p-4">
                <Tag>{s.tag}</Tag>
                <div className="mt-1 text-sm font-bold text-ink">{s.title}</div>
                <p className="mt-1 text-xs leading-5 text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
          <li className="relative">
            <span className="absolute -left-[29px] top-2 inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
            <div className="rounded-lg border border-accent/30 bg-accent-soft/50 p-4">
              <Tag tone="accent">판정</Tag>
              <div className="mt-1 text-sm font-bold text-ink">합격선 {PASS_LINE}% 기준으로 판정합니다</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-line bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="num text-sm font-bold text-ink">≥ {PASS_LINE}%</span>
                    <VerdictBadge verdict="apply" size="sm" />
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted">스토리보완 이력서로 지원합니다.</p>
                </div>
                <div className="rounded-md border border-line bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="num text-sm font-bold text-ink">{"<"} {PASS_LINE}%</span>
                    <span className="text-xs font-semibold text-hold">결과물 3 · 목표 이력서</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    무엇을 보강할지 네 갈래로 받고, 보강을 마치면 스토리보완 이력서로 돌아와 다시 판정합니다.
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </figure>

      <figure className="card p-5 sm:p-6">
        <div className="text-sm font-bold text-ink">같은 기본 60%라도, 판정은 스토리보완 충족률로 갈립니다</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">① 갈음 논증에 근거가 충분할 때</span>
              <VerdictBadge verdict="apply" size="sm" />
            </div>
            <ScoreMeter face={60} story={80} size="sm" className="mt-3" />
            <p className="mt-3 text-xs leading-5 text-muted">스토리보완 80%로 합격선에 닿았습니다. 지원합니다.</p>
          </div>
          <div className="rounded-lg border border-line p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted">② 근거가 일부만 붙을 때</span>
              <VerdictBadge verdict="hold" size="sm" />
            </div>
            <ScoreMeter face={60} story={70} size="sm" className="mt-3" />
            <p className="mt-3 text-xs leading-5 text-muted">스토리보완 70%. 목표 이력서로 10%p를 채운 뒤 지원합니다.</p>
          </div>
        </div>
      </figure>
    </div>
  );
}

const BASIC_ITEMS = ["2024 ○○ 프로젝트 참여 (C++, 렌더링)", "2023 △△ 스터디", "자격증 취득", "2022 □□ 인턴 (업무 지원)"];
const STORY_ITEMS = ["○○ 엔진 렌더링 최적화 — 프레임 20% 개선 (2024)", "인기 게임 5종의 그래픽 파이프라인 분석 보고"];

/** 통찰 3 — 기본 이력서(목록) vs 스토리보완 이력서(근거) */
export function ResumeCompare() {
  return (
    <figure className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
      <div className="card p-5">
        <Tag>기본 이력서</Tag>
        <div className="mt-1 text-sm font-bold text-ink">내가 한 일의 목록</div>
        <ul className="mt-3 space-y-2 text-sm text-ink-2">
          {BASIC_ITEMS.map((t) => (
            <li key={t} className="flex gap-2.5">
              <span className="mt-2.5 inline-block h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
          부서장은 여기서 자기 질문의 답을 찾아야 합니다. 대개 찾지 못합니다.
        </p>
      </div>
      <FlowArrow className="w-full md:w-10" />
      <div className="card border-accent/30 p-5">
        <Tag tone="accent">스토리보완 이력서</Tag>
        <div className="mt-1 text-sm font-bold text-ink">우리 일을 해낼 근거</div>
        <div className="mt-3 rounded-md bg-accent-soft/60 px-3 py-2 text-xs leading-5 text-ink">
          “게임사 엔지니어와 기술 대화가 되는가”에 답합니다.
        </div>
        <ul className="mt-3 space-y-2 text-sm text-ink">
          {STORY_ITEMS.map((t) => (
            <li key={t} className="flex gap-2.5">
              <span className="mt-2.5 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
          같은 경험입니다. 부서장의 질문에 답하는 순서와 말로 다시 쓴 것뿐입니다.
        </p>
      </div>
    </figure>
  );
}

const PARTS = [
  { num: "결과물 1", title: "부서장이 뽑으려는 사람", desc: "실제 일 · 사람의 상 · 항목마다 담보하려는 능력 · 부서장의 질문" },
  { num: "결과물 2-1", title: "기본 이력서", desc: "내 이력을 항목별로 대응한 액면 충족률" },
  { num: "결과물 2-2", title: "스토리보완 이력서", desc: "갈음 논증 + 이력 속 근거 · 보완 후 충족률 · 제출용 이력서 전문" },
  { num: "결과물 3", title: "목표 이력서", desc: "80%까지의 보강 로드맵 · 보강 예정 항목이 표시된 이력서" },
  { num: "판정", title: "지원 · 보류 · 비추천", desc: "스토리보완 충족률과 합격선 80%로 냉정하게 · 판정 근거 한 문단" },
];

const CATEGORIES: GapCategory[] = ["hidden", "weak", "missing", "hard"];

/** 결과 화면 구성 — 4 결과물 + 판정, 결과물 3의 네 갈래 */
export function ResultLayout() {
  return (
    <div className="space-y-6">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PARTS.map((p) => (
          <li key={p.num} className={`card p-4 ${p.num === "판정" ? "border-accent/30 bg-accent-soft/40" : ""}`}>
            <Tag tone={p.num === "판정" ? "accent" : "muted"}>{p.num}</Tag>
            <div className="mt-1 text-sm font-bold text-ink">{p.title}</div>
            <p className="mt-1.5 text-xs leading-5 text-muted">{p.desc}</p>
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-6">
        <div className="text-sm font-bold text-ink">결과물 3 · 목표 이력서의 네 갈래</div>
        <p className="mt-1 text-xs leading-5 text-muted">
          합격선에 못 미치면 부족한 항목을 네 갈래로 나눠, 무엇을 하면 몇 %p가 오르는지와 걸리는 기간을 함께 줍니다.
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => {
            const m = GAP_CATEGORY_META[c];
            return (
              <li key={c} className="rounded-lg border border-line p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-accent">{m.num}</span>
                  <span className="text-sm font-bold text-ink">{m.title}</span>
                </div>
                <div className="ml-6 mt-1 text-sm text-ink-2">→ {m.action}</div>
                <p className="ml-6 mt-1.5 text-xs leading-5 text-muted">{m.hint}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
