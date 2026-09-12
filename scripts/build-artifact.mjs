/**
 * claude.ai 아티팩트용 단일 페이지 번들을 만든다.
 *   artifact/dist/app.js   — React 앱 (해시 라우터, 브라우저 내 분석)
 *   artifact/dist/app.css  — Tailwind 컴파일 결과
 *   artifact/dist/index.html — 아티팩트 본문 (doctype/html/head/body 없이)
 *   artifact/dist/local.html — 로컬 확인용 전체 문서
 */
import { build } from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dist = path.join(root, "artifact", "dist");
fs.mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(root, "artifact/main.tsx")],
  bundle: true,
  minify: true,
  sourcemap: false,
  format: "iife",
  target: ["es2020"],
  platform: "browser",
  outfile: path.join(dist, "app.js"),
  jsx: "automatic",
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "next/link": "./artifact/shims/link.tsx",
    "next/navigation": "./artifact/shims/navigation.ts",
    "@/lib/client/transport": "./artifact/transport.ts",
  },
  absWorkingDir: root,
  logLevel: "info",
});

execSync(`pnpm exec tailwindcss -i src/app/globals.css -o artifact/dist/app.css --minify`, { cwd: root, stdio: "inherit" });

const head = `<title>RoleFit Canvas</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="app.css">
<style>:root{--font-noto-kr:"Noto Sans KR";--font-geist-mono:ui-monospace,SFMono-Regular,Menlo,monospace}#root{min-height:100vh;display:flex;flex-direction:column}</style>`;
const body = `<div id="root"></div>
<script src="app.js"></script>`;
fs.writeFileSync(path.join(dist, "index.html"), `${head}\n${body}\n`);
fs.writeFileSync(
  path.join(dist, "local.html"),
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${body}</body></html>\n`,
);
const size = (f) => (fs.statSync(path.join(dist, f)).size / 1024).toFixed(0) + "KB";
console.log(`built: app.js ${size("app.js")}, app.css ${size("app.css")}`);
