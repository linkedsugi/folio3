import type { AnchorHTMLAttributes, ReactNode } from "react";
import { toHash } from "./hashRouter";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

/** next/link 대체 — 해시 라우팅 앵커 */
export default function Link({ href, children, prefetch: _p, replace: _r, scroll: _s, ...rest }: Props) {
  void _p;
  void _r;
  void _s;
  const h = typeof href === "string" ? href : (href.pathname ?? "/");
  return (
    <a href={toHash(h)} {...rest}>
      {children}
    </a>
  );
}
