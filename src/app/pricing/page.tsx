import type { Metadata } from "next";
import { CreditStatus } from "@/components/pricing/CreditStatus";
import { PlanCard } from "@/components/pricing/PlanCard";
import { Container, LinkButton, Pill, SectionLabel } from "@/components/ui";
import { COPY, PLANS } from "@/lib/copy";

export const metadata: Metadata = { title: "요금" };

const FREE = [
  "첫 공고 1건 — 결과물 전부",
  "모든 공고의 결과물 1 「부서장이 뽑으려는 사람」",
  "모든 공고의 결과물 2-1 기본 이력서 · 액면 충족률",
  "모든 공고의 스토리보완 충족률과 최종 판정 (지원 · 보류 · 비추천)",
  "샘플 결과 열람",
] as const;

const PAID = [
  "두 번째 공고부터 갈음 논증 본문과 이력 원문 근거",
  "스토리보완 이력서 전문 · 복사 · 다운로드 · 인쇄",
  "목표 이력서 보강 항목 · 체크리스트 · 보강 후 재분석 (공고당 3회 포함)",
  "재분석 무제한 (패스)",
] as const;

const WHY = [
  {
    lead: "판단에 값을 매깁니다.",
    body: "이력서 첨삭이 아니라, 이 공고에 지원할지 말지의 판단과 그 근거를 드립니다.",
  },
  {
    lead: "근거 없는 점수는 팔지 않습니다.",
    body: "이력에서 근거를 찾지 못한 주장은 점수에 넣지 않습니다. 그래서 80%는 희망이 아니라 판단입니다.",
  },
  {
    lead: "보강하면 다시 재봅니다.",
    body: "보류 판정을 받았다면, 목표 이력서를 채우고 같은 크레딧으로 다시 분석할 수 있습니다.",
  },
] as const;

const FAQ = [
  { q: "첫 공고는 정말 전부 무료인가요?", a: "네. 결과물 1·2-1·2-2·3과 최종 판정을 모두 볼 수 있습니다." },
  {
    q: "두 번째 공고부터 무료로 볼 수 있는 건 무엇인가요?",
    a: "「부서장이 뽑으려는 사람」, 기본 이력서(액면 충족률), 스토리보완 충족률과 최종 판정까지 무료입니다. 여러 공고를 비교해 판단하는 데는 크레딧이 들지 않습니다. 갈음 논증 본문·이력 원문 근거·스토리보완 이력서 전문·목표 이력서 체크리스트·재분석은 크레딧이 필요합니다.",
  },
  {
    q: "지금 결제할 수 있나요?",
    a: "아니요. 결제 기능은 준비 중이며, 베타 기간에는 브라우저당 베타 크레딧 3개가 제공됩니다 (자동 충전 없음). 이미 연 공고의 재분석은 크레딧 없이 계속 가능합니다.",
  },
  { q: "충족률이 합격을 보장하나요?", a: "아닙니다. 부서장 관점의 추정이며, 근거가 확인된 항목만 반영한 보수적인 수치입니다." },
  {
    q: "내 이력과 JD는 어디에 저장되나요?",
    a: "브라우저(localStorage)에만 저장됩니다. 서버 데이터베이스에 보관하지 않습니다. 분석 시에만 AI 모델에 전송됩니다.",
  },
  {
    q: "재분석은 무엇인가요?",
    a: "목표 이력서의 보강 항목을 채운 뒤 같은 공고를 다시 분석하는 것입니다. 공고 1건당 3회가 포함됩니다.",
  },
] as const;

function ScopeColumn({ title, items, tone }: { title: string; items: readonly string[]; tone: "apply" | "accent" }) {
  return (
    <div className="p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
        <Pill tone={tone}>{tone === "apply" ? "무료" : "크레딧"}</Pill>
        {title}
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5 text-sm leading-6 text-ink-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5">
            <span className={`mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full ${tone === "apply" ? "bg-apply" : "bg-accent"}`} aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Container className="pb-8 pt-6 sm:pt-8">
      {/* 베타 안내 — 닫을 수 없는 고정 공지. .card 는 레이어 밖 CSS 라 border-color 를 덮어쓸 수 없어 유틸리티로 조립한다 */}
      <div role="note" className="rounded-card border border-hold/50 bg-hold-soft/50 px-4 py-3 text-sm leading-6 text-ink-2 shadow-card">
        {COPY.pricing.banner}
      </div>

      <section className="pt-10 sm:pt-14" aria-labelledby="pricing-h1">
        <SectionLabel>요금</SectionLabel>
        <h1 id="pricing-h1" className="mt-3 max-w-3xl text-[26px] font-black leading-[1.25] tracking-tight text-ink sm:text-4xl">
          지원할지 말지, 공고 1건에 3,900원으로 먼저 판단하세요
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-2">
          첫 공고는 무료입니다. 부서장의 눈으로 JD를 읽고, 근거 있는 이력서로 합격선 80%에 닿는지 냉정하게 잽니다.
        </p>
        <div className="mt-6 flex flex-col items-start gap-2.5">
          <LinkButton href="/analyze" size="lg">
            첫 공고 무료로 분석하기
          </LinkButton>
          <p className="text-xs leading-5 text-muted">{COPY.pricing.caption}</p>
        </div>
      </section>

      <section className="mt-14 sm:mt-16" aria-labelledby="scope-h2">
        <h2 id="scope-h2" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
          무료로 되는 것 / 크레딧이 필요한 것
        </h2>
        <div className="card mt-4 grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <ScopeColumn title="무료로 되는 것" items={FREE} tone="apply" />
          <ScopeColumn title="크레딧이 필요한 것" items={PAID} tone="accent" />
        </div>
      </section>

      <section className="mt-14 sm:mt-16" aria-labelledby="plans-h2">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="plans-h2" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              출시 예정 요금
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              지금은 청구되지 않습니다. 베타 기간에는 같은 기능을 베타 크레딧으로 이용합니다.
            </p>
          </div>
          <CreditStatus className="md:max-w-md" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>

      <section className="mt-14 sm:mt-16" aria-labelledby="why-h2">
        <h2 id="why-h2" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
          왜 돈을 받나요
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {WHY.map((w, i) => (
            <li key={w.lead} className="card p-5">
              <div className="num text-xs font-bold text-muted">0{i + 1}</div>
              <p className="mt-2 text-sm leading-6 text-ink-2">
                <strong className="mb-1 block text-base leading-6 text-ink">{w.lead}</strong>
                {w.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 sm:mt-16" aria-labelledby="faq-h2">
        <h2 id="faq-h2" className="text-lg font-bold tracking-tight text-ink sm:text-xl">
          자주 묻는 질문
        </h2>
        <div className="card mt-4 divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded py-4 text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </summary>
              <p className="pb-4 text-sm leading-6 text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-12 text-xs leading-5 text-faint">
        충족률과 판정은 합격을 보장하지 않습니다. RoleFit Canvas는 채용사와 무관하며, 결과는 지원 판단을 돕기 위한 참고 자료입니다.
      </p>
    </Container>
  );
}
