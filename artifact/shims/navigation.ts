import { useMemo } from "react";
import { navigate, parseHash, useHash } from "./hashRouter";

/** next/navigation 대체 (해시 라우터 기반) */
export function useRouter() {
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => {
        const target = href.startsWith("#") ? href : `#${href}`;
        window.location.replace(`${window.location.pathname}${window.location.search}${target}`);
      },
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => undefined,
      prefetch: () => undefined,
    }),
    [],
  );
}

export function usePathname(): string {
  const hash = useHash();
  return parseHash(hash).path;
}

export function useSearchParams(): URLSearchParams {
  const hash = useHash();
  return useMemo(() => parseHash(hash).query, [hash]);
}

export function useParams(): Record<string, string> {
  return {};
}

export function redirect(href: string): never {
  navigate(href);
  throw new Error("redirect");
}

export function notFound(): never {
  navigate("/404");
  throw new Error("notFound");
}
