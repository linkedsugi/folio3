import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PipelineDiagram, ResultLayout, ResumeCompare, RoleDiagram } from "@/components/landing/MethodDiagrams";
import { ColdRule } from "@/components/landing/Pipeline";
import { Heading } from "@/components/landing/Section";
import { Shift } from "@/components/landing/Shift";
import { Container, LinkButton } from "@/components/ui";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = { title: "판단 방식" };

const TOC = [
  { id: "thesis", label: "한 문장 논지" },
  { id: "principles", label: "원칙 1 · 2" },
  { id: "insight-1", label: "통찰 1 · 항목에서 사람을 복원" },
  { id: "insight-2", label: "통찰 2 · 근거를 세우고 판정" },
  { id: "insight-3", label: "통찰 3 · 목록이 아니라 근거" },
  { id: "result", label: "결과 화면 구성" },
  { id: "shift", label: "바뀌는 것" },
];

function MethodSection({
  id,
  label,
  title,
  lead,
  children,
}: {
  id: string;
  label: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <Heading label={label} title={title} lead={lead} />
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function MethodPage() {
  return (
    <Container className="py-12 sm:py-16">
      <Heading
        as="h1"
        label="판단 방식"
        title="지원 판단은 항목을 맞추는 일이 아니라, 역할을 복원하고 근거를 세우는 일입니다"
        lead="RoleFit Canvas가 공고와 이력을 어떻게 읽고, 무엇을 근거로 숫자를 내고, 어디서 냉정해지는지 순서대로 적었습니다. 결과 화면의 모든 숫자는 이 페이지의 규칙으로 나옵니다."
      />

      <div className="mt-10 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
        <aside className="hidden lg:block">
          <nav aria-label="목차" className="sticky top-20">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">목차</div>
            <ol className="mt-3 space-y-1 border-l border-line">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="-ml-px block border-l border-transparent py-1 pl-4 text-sm leading-6 text-ink-2 hover:border-ink hover:text-ink"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-6 space-y-2">
              <LinkButton href="/analyze" size="sm" className="w-full">
                {COPY.hero.cta}
              </LinkButton>
              <LinkButton href="/result/sample" size="sm" variant="secondary" className="w-full">
                {COPY.hero.sample}
              </LinkButton>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-16 sm:space-y-20">
          <MethodSection id="thesis" label="한 문장 논지" title="JD는 한 사람이 해낼 실제 역할을 항목으로 해체해 놓은 문서입니다">
            <blockquote className="card border-l-4 border-l-ink p-5 text-[17px] font-medium leading-8 text-ink sm:p-6 sm:text-lg sm:leading-9">
              지원 판단은 항목을 하나씩 맞추는 일이 아니라, 뽑는 부서장의 눈으로 그 역할을 복원하고, 내가 그 역할을 해낼 수 있다는
              근거를 세운 뒤, 합격선 80% 기준으로 냉정하게 판정하는 일입니다.
            </blockquote>
          </MethodSection>

          <MethodSection id="principles" label="원칙" title="두 가지 원칙" lead="모든 단계는 이 두 원칙 위에서 움직입니다.">
            <ol className="grid gap-4 md:grid-cols-2">
              <li className="card p-5 sm:p-6">
                <div className="num text-xs font-bold tracking-[0.14em] text-accent">원칙 1</div>
                <h3 className="mt-2 text-lg font-bold text-ink">JD는 부서장의 관점에서 봅니다.</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">
                  항목은 결과이고, 원인은 부서장이 채우려는 역할입니다. 항목을 읽는 것이 아니라, 그 항목을 쓰게 만든 사람을 읽습니다.
                </p>
              </li>
              <li className="card p-5 sm:p-6">
                <div className="num text-xs font-bold tracking-[0.14em] text-accent">원칙 2</div>
                <h3 className="mt-2 text-lg font-bold text-ink">이력서는 부서장이 원하고 좋아하는 것을 씁니다.</h3>
                <p className="mt-2 text-sm leading-6 text-ink-2">
                  내가 한 일의 목록이 아니라, 부서장이 이력서를 읽으며 던지는 질문에 답하는 순서와 말로 씁니다.
                </p>
              </li>
            </ol>
          </MethodSection>

          <MethodSection
            id="insight-1"
            label="통찰 1"
            title="부서장은 역할을 항목으로 해체하고, 앱은 항목에서 사람을 복원합니다"
            lead="부서장은 한 사람이 해낼 일을 먼저 떠올린 뒤, 그것을 자격 요건과 우대 사항으로 나눠 씁니다. 앱은 그 방향을 거꾸로 읽습니다. 항목이 무엇을 담보하려는 것인지 묻고, 그 답들을 다시 한 사람으로 모읍니다."
          >
            <RoleDiagram />
          </MethodSection>

          <MethodSection
            id="insight-2"
            label="통찰 2"
            title="액면은 출발점이고, 판정은 근거가 붙은 스토리보완 충족률로 내립니다"
            lead="내 이력을 항목에 그대로 대응하면 액면 충족률이 나옵니다. 부서장이 항목으로 담보하려던 능력을 내 다른 경험으로 갈음할 수 있으면, 근거를 붙여 스토리보완 이력서를 만들고 그 충족률로 합격선 80%에 견줍니다. 못 미치면 목표 이력서가 무엇을 보강할지 줍니다."
          >
            <PipelineDiagram />
            <ColdRule className="mt-6" />
          </MethodSection>

          <MethodSection
            id="insight-3"
            label="통찰 3"
            title="기본 이력서는 내가 한 일의 목록이고, 스토리보완 이력서는 우리 일을 해낼 근거입니다"
            lead="같은 경험도 부서장의 질문에 답하는 형태로 다시 쓰면 근거가 됩니다. 앱은 이 재배열을 대신 해 주되, 이력에 없는 사실은 한 줄도 만들어 넣지 않습니다."
          >
            <ResumeCompare />
          </MethodSection>

          <MethodSection
            id="result"
            label="결과 화면"
            title="결과 화면 구성"
            lead="공고 한 건에 결과물 넷과 판정 하나를 받습니다. 합격선에 못 미치면 결과물 3이 네 갈래로 무엇을 보강할지 줍니다."
          >
            <ResultLayout />
          </MethodSection>

          <MethodSection id="shift" label="바뀌는 것" title={COPY.shift.title}>
            <Shift />
          </MethodSection>

          <section className="card p-6 sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">지원은 판단이 됩니다.</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-7 text-ink-2">
              공고와 이력을 넣으면 위 순서 그대로 결과를 받습니다. 먼저 샘플로 결과 화면을 살펴보셔도 됩니다.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/analyze" size="lg">
                {COPY.hero.cta}
              </LinkButton>
              <LinkButton href="/result/sample" variant="secondary" size="lg">
                {COPY.hero.sample}
              </LinkButton>
            </div>
            <p className="mt-3 text-xs text-muted">{COPY.hero.ctaSub}</p>
          </section>
        </div>
      </div>
    </Container>
  );
}
