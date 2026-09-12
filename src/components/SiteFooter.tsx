import Link from "next/link";
import { Container } from "./ui";
import { COPY } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-paper-2/60">
      <Container className="py-10 text-sm text-muted">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <div className="font-bold text-ink">{COPY.brand}</div>
            <p className="mt-2 leading-6">뿌리는 지원에서, 판단하는 지원으로. 부서장의 눈으로 JD를 읽고, 근거가 붙은 이력서로 합격선 80%에 닿는지 냉정하게 잽니다.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/analyze" className="hover:text-ink">분석하기</Link>
            <Link href="/history" className="hover:text-ink">내 공고</Link>
            <Link href="/method" className="hover:text-ink">판단 방식</Link>
            <Link href="/pricing" className="hover:text-ink">요금</Link>
          </nav>
        </div>
        <p className="mt-8 text-xs leading-5 text-faint">
          {COPY.result.disclaimer} RoleFit Canvas는 채용사와 무관하며, 결과는 지원 판단을 돕기 위한 참고 자료입니다. 모든 데이터는 이 브라우저에만 저장됩니다. 베타 · 후기 수집 전.
        </p>
      </Container>
    </footer>
  );
}
