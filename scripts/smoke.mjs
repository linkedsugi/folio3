import { chromium } from "@playwright/test";
const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || ".smoke";
import fs from "node:fs";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const errors = [];
async function page(width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, locale: "ko-KR" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${width}] pageerror ${p.url()}: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !/404/.test(m.text())) errors.push(`[${width}] console ${p.url()}: ${m.text()}`); });
  return { ctx, p };
}
async function shoot(p, name) {
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  const cw = await p.evaluate(() => document.documentElement.clientWidth);
  if (sw > cw + 1) errors.push(`horizontal overflow on ${name}: scrollWidth ${sw} > clientWidth ${cw}`);
}
for (const width of [400, 1280]) {
  const { ctx, p } = await page(width);
  const routes = ["/", "/method", "/pricing", "/history", "/result/sample", "/result/sample/resume", "/analyze", "/nope"];
  for (const r of routes) {
    const res = await p.goto(BASE + r, { waitUntil: "networkidle", timeout: 120000 });
    console.log(width, r, res?.status());
    await shoot(p, `${width}-${r.replace(/\//g, "_") || "root"}`);
  }
  // full flow: analyze with sample → progress → result
  await p.goto(BASE + "/analyze", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "샘플 공고·이력으로 채워보기" }).click();
  await p.getByRole("button", { name: "부서장의 눈으로 분석하기" }).click();
  await p.waitForTimeout(2500);
  await shoot(p, `${width}-progress`);
  await p.waitForURL(/\/result\/(?!sample)/, { timeout: 60000 });
  await p.waitForLoadState("networkidle");
  await shoot(p, `${width}-result-demo`);
  const url = p.url();
  console.log(width, "result url", url);
  // checklist toggle persists
  const cb = p.locator('input[type="checkbox"]').first();
  await cb.check();
  await p.reload({ waitUntil: "networkidle" });
  const checked = await p.locator('input[type="checkbox"]').first().isChecked();
  console.log(width, "checkbox persisted:", checked);
  if (!checked) errors.push("checkbox did not persist");
  // history shows it
  await p.goto(BASE + "/history", { waitUntil: "networkidle" });
  await shoot(p, `${width}-history-filled`);
  // second analysis (sample again) should still be unlocked (sample), so test gate by faking a live analysis in storage
  await p.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("rolefit:analyses:v1") || "[]");
    const a = { ...list[0], id: "locked1", mode: "live", unlocked: false, unlockedBy: null, parentId: null };
    list.unshift(a);
    localStorage.setItem("rolefit:analyses:v1", JSON.stringify(list));
    localStorage.setItem("rolefit:credits:v1", JSON.stringify({ firstFreeUsed: true, beta: 3, betaRefillAt: null, purchased: 0 }));
  });
  await p.goto(BASE + "/result/locked1", { waitUntil: "networkidle" });
  await shoot(p, `${width}-result-locked`);
  await p.getByRole("button", { name: /베타 크레딧으로 열기 \(남은/ }).click();
  await p.getByRole("dialog").getByRole("button", { name: "베타 크레딧으로 열기" }).click();
  await p.waitForTimeout(500);
  const creditsAfter = await p.evaluate(() => JSON.parse(localStorage.getItem("rolefit:credits:v1")));
  console.log(width, "credits after unlock:", JSON.stringify(creditsAfter));
  if (creditsAfter.beta !== 2) errors.push("beta credit not consumed");
  await shoot(p, `${width}-result-unlocked`);
  await ctx.close();
}
await browser.close();
console.log("ERRORS:", errors.length);
for (const e of errors) console.log(" -", e);
process.exit(errors.length ? 1 : 0);
