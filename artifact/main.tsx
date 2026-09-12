import { StrictMode, Suspense, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import LandingPage from "@/app/page";
import MethodPage from "@/app/method/page";
import PricingPage from "@/app/pricing/page";
import HistoryPage from "@/app/history/page";
import ResultPage from "@/app/result/[id]/page";
import ResumePrintPage from "@/app/result/[id]/resume/page";
import NotFound from "@/app/not-found";
import { AnalyzePage } from "./AnalyzePage";
import { parseHash, useHash } from "./shims/hashRouter";

const BRAND = "RoleFit Canvas";

/** React 19 `use()` 가 즉시 읽을 수 있도록 미리 해결된 프로미스로 만든다 */
function resolvedParams<T extends object>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status?: string; value?: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

function Router() {
  const hash = useHash();
  const route = useMemo(() => parseHash(hash), [hash]);
  const { path, fragment } = route;

  const resultMatch = /^\/result\/([^/]+)(\/resume)?\/?$/.exec(path);
  const resultId = resultMatch?.[1] ?? null;
  const isResume = Boolean(resultMatch?.[2]);
  const params = useMemo(() => (resultId ? resolvedParams({ id: decodeURIComponent(resultId) }) : null), [resultId]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/": `${BRAND} — 지원할지 말지, 부서장의 눈으로 먼저 판단하세요`,
      "/analyze": `분석하기 · ${BRAND}`,
      "/history": `내 공고 · ${BRAND}`,
      "/pricing": `요금 · ${BRAND}`,
      "/method": `판단 방식 · ${BRAND}`,
    };
    document.title = titles[path] ?? (resultId ? `결과 · ${BRAND}` : BRAND);
    if (fragment) {
      const el = document.getElementById(fragment);
      if (el) el.scrollIntoView({ block: "start" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [path, fragment, resultId]);

  let page: React.ReactNode;
  if (path === "/" ) page = <LandingPage />;
  else if (path === "/analyze") page = <AnalyzePage />;
  else if (path === "/history") page = <HistoryPage />;
  else if (path === "/pricing") page = <PricingPage />;
  else if (path === "/method") page = <MethodPage />;
  else if (params && isResume) page = <ResumePrintPage params={params} />;
  else if (params) page = <ResultPage params={params} />;
  else page = <NotFound />;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={null}>{page}</Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

/** 페이지 내 앵커(#s3 등)는 라우트가 아니라 스크롤로 처리한다 */
function installAnchorHandler() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("#") || href.startsWith("#/")) return;
    const id = href.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

installAnchorHandler();
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Router />
    </StrictMode>,
  );
}
