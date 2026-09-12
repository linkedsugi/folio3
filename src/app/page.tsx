import Link from "next/link";
import { FinalCta, PricingTeaser } from "@/components/landing/CtaBands";
import { Honesty } from "@/components/landing/Honesty";
import { Pipeline } from "@/components/landing/Pipeline";
import { PreviewCards } from "@/components/landing/PreviewCards";
import { getSampleFacts } from "@/components/landing/sampleFacts";
import { Section } from "@/components/landing/Section";
import { Shift } from "@/components/landing/Shift";
import { VerdictCard } from "@/components/landing/VerdictCard";
import { Container, LinkButton, Pill } from "@/components/ui";
import { COPY } from "@/lib/copy";

export default function Home() {
  const facts = getSampleFacts();

  return (
    <>
      {/* 1. Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <h1 className="text-[28px] font-black leading-[1.25] tracking-tight text-ink text-balance sm:text-4xl lg:text-[40px]">
              {COPY.hero.h1}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-2 sm:text-base sm:leading-8">{COPY.hero.sub}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <LinkButton href="/analyze" size="lg">
                {COPY.hero.cta}
              </LinkButton>
              <LinkButton href="/result/sample" variant="secondary" size="lg">
                {COPY.hero.sample}
              </LinkButton>
            </div>
            <p className="mt-3 text-xs text-muted">{COPY.hero.ctaSub}</p>

            <ul className="mt-8 flex flex-wrap gap-2" aria-label="약속">
              {COPY.hero.pills.map((p) => (
                <li key={p}>
                  <Pill>{p}</Pill>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 lg:justify-self-end lg:w-full lg:max-w-md">
            <VerdictCard facts={facts} />
          </div>
        </Container>
      </section>

      {/* 2. 이런 결과를 받습니다 */}
      <Section
        id="preview"
        label="결과물"
        title="이런 결과를 받습니다"
        lead={
          <>
            공고 한 건마다 결과물 넷과 판정 하나를 받습니다. 숫자는 늘 맥락과 함께 읽습니다 — 액면 {facts.face}% → 스토리보완{" "}
            {facts.story}% · 합격선 {facts.passLine}%.
          </>
        }
      >
        <PreviewCards facts={facts} />
      </Section>

      {/* 3. 어떻게 판단하나 */}
      <Section
        id="how"
        label="판단 방식"
        title="어떻게 판단하나"
        lead="네 단계를 순서대로 거칩니다. 각 단계는 앞 단계의 결과 위에서만 움직이고, 근거가 붙지 않은 주장은 어느 단계에서도 점수에 들어가지 않습니다."
        tone="alt"
      >
        <Pipeline />
        <div className="mt-6">
          <Link href="/method" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            판단 방식 자세히 읽기 →
          </Link>
        </div>
      </Section>

      {/* 4. 뿌리는 지원에서, 판단하는 지원으로 */}
      <Section id="shift" label="바뀌는 것" title={COPY.shift.title}>
        <Shift />
      </Section>

      {/* 5. 받는 것 / 받지 않는 것 */}
      <Section
        id="honesty"
        label="정직하게"
        title="받는 것, 받지 않는 것"
        lead="이 앱은 지원 여부를 판단할 근거를 만들어 드립니다. 그 밖의 것은 약속하지 않습니다."
        tone="alt"
      >
        <Honesty />
      </Section>

      {/* 6. 요금 */}
      <Section id="pricing" label="요금" title="공고 한 건의 판단에 드는 값">
        <PricingTeaser />
      </Section>

      {/* 7. 마지막 CTA */}
      <FinalCta />
    </>
  );
}
