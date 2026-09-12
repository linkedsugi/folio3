/** 해시 라우터 — "#/result/abc?from=x#gate" 를 경로·쿼리·조각으로 나눈다 */
import { useSyncExternalStore } from "react";

export interface HashRoute {
  path: string;
  query: URLSearchParams;
  fragment: string | null;
  raw: string;
}

export function parseHash(hash: string): HashRoute {
  if (!hash.startsWith("#/")) return { path: "/", query: new URLSearchParams(), fragment: null, raw: hash };
  let rest = hash.slice(1);
  let fragment: string | null = null;
  const f = rest.indexOf("#");
  if (f >= 0) {
    fragment = rest.slice(f + 1);
    rest = rest.slice(0, f);
  }
  const q = rest.indexOf("?");
  const path = q >= 0 ? rest.slice(0, q) : rest;
  const query = new URLSearchParams(q >= 0 ? rest.slice(q + 1) : "");
  return { path: path || "/", query, fragment, raw: hash };
}

const listeners = new Set<() => void>();
let current = typeof window !== "undefined" ? window.location.hash : "";

function onHashChange() {
  current = window.location.hash;
  for (const l of listeners) l();
}

export function subscribeHash(cb: () => void): () => void {
  if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("hashchange", onHashChange);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("hashchange", onHashChange);
  };
}

export function useHash(): string {
  return useSyncExternalStore(subscribeHash, () => current, () => "");
}

/** 앱 내부 경로("/analyze?from=x")를 해시 링크로 */
export function toHash(href: string): string {
  if (href.startsWith("#")) return href; // 페이지 내 앵커
  if (/^https?:\/\//.test(href) || href.startsWith("mailto:")) return href;
  return `#${href}`;
}

export function navigate(href: string) {
  window.location.hash = toHash(href);
}
