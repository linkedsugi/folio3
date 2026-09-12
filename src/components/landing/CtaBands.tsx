import Link from "next/link";
import { Container, LinkButton } from "@/components/ui";
import { COPY, PLANS, won } from "@/lib/copy";

const single = PLANS.find((p) => p.id === "single") ?? PLANS[0];

export function PricingTeaser() {
  return (
    <div className="card flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl">
        <p className="text-[15px] leading-7 text-ink-2">{COPY.pricing.caption}</p>
        <p className="mt-3 text-lg font-bold text-ink">
          첫 공고 무료 · 이후 공고 1건 <span className="num">{won(single.price)}</span>
          <span className="ml-1.5 text-sm font-medium text-muted">(출시 예정가)</span>
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">{single.note}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
        <LinkButton href="/analyze">{COPY.hero.cta}</LinkButton>
        <LinkButton href="/pricing" variant="secondary">
          요금 보기
        </LinkButton>
      </div>
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="bg-ink text-white">
      <Container className="py-16 sm:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">지원은 판단이 됩니다.</h2>
          <p className="mt-3 text-[15px] leading-7 text-white/75">
            공고와 이력을 넣으면, 부서장이 뽑으려는 사람과 지금 내가 선 자리를 한 화면에서 봅니다. 결과를 보고 나서 지원할지
            정하세요.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <LinkButton href="/analyze" variant="secondary" size="lg">
            {COPY.hero.cta}
          </LinkButton>
          <Link
            href="/result/sample"
            className="inline-flex h-13 items-center justify-center rounded-lg px-6 text-base font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            {COPY.hero.sample}
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/55">{COPY.hero.ctaSub}</p>
      </Container>
    </section>
  );
}
