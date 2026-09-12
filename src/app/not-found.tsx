import Link from "next/link";
import { Container, LinkButton, SectionLabel } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="card mx-auto max-w-lg p-6 text-center sm:p-8">
        <SectionLabel>404</SectionLabel>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-ink">페이지를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          주소가 바뀌었거나 없는 페이지입니다. 결과 페이지였다면 이 브라우저에 저장된{" "}
          <Link href="/history" className="font-medium text-ink underline underline-offset-4 hover:text-accent">
            내 공고
          </Link>
          에서 다시 열 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <LinkButton href="/">홈으로</LinkButton>
          <LinkButton href="/analyze" variant="secondary">
            새 분석 시작
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
