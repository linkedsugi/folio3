import type { BasicResume, ManagerView, StoryResume } from "@/lib/types";
import { LEVEL_LABEL, LEVEL_VALUE, PRIORITY_LABEL, effectiveWeight, storyLevelMap } from "@/lib/scoring";

/** "어떻게 계산했나요?" — 항목별 가중치·액면·스토리·반영 여부. 합계가 화면의 %와 일치한다 */
export function ScoreSheet({ view, basic, story }: { view: ManagerView; basic: BasicResume; story: StoryResume }) {
  const levels = storyLevelMap(basic.matches, story.arguments);
  const total = view.items.reduce((s, it) => s + effectiveWeight(it), 0);
  const rows = view.items.map((it) => {
    const w = effectiveWeight(it);
    const f = basic.matches.find((m) => m.itemId === it.id)?.level ?? "unmet";
    const s = levels.get(it.id) ?? f;
    const arg = story.arguments.find((a) => a.itemId === it.id);
    return { it, w, f, s, arg };
  });
  const facePts = rows.reduce((acc, r) => acc + r.w * LEVEL_VALUE[r.f], 0);
  const storyPts = rows.reduce((acc, r) => acc + r.w * LEVEL_VALUE[r.s], 0);
  return (
    <details className="rounded-lg border border-line bg-paper">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-ink">어떻게 계산했나요? — 점수 산출표</summary>
      <div className="px-4 pb-4">
        <p className="mb-3 text-xs leading-5 text-muted">
          충족률 = Σ(항목 무게 × 충족 수준) ÷ Σ(항목 무게). 충족 1 · 부분 0.5 · 미충족 0. 필수 항목은 무게를 1.5배로 봅니다. 갈음 논증은 이력 원문 근거가 확인된 경우에만 수준을 올립니다.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="border-b border-line py-2 pr-2 font-semibold">항목</th>
                <th className="border-b border-line py-2 pr-2 font-semibold">구분</th>
                <th className="num border-b border-line py-2 pr-2 text-right font-semibold">무게</th>
                <th className="border-b border-line py-2 pr-2 font-semibold">액면</th>
                <th className="border-b border-line py-2 pr-2 font-semibold">스토리보완</th>
                <th className="border-b border-line py-2 font-semibold">반영</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ it, w, f, s, arg }) => (
                <tr key={it.id}>
                  <td className="border-b border-line py-2 pr-2 text-ink">{it.label}</td>
                  <td className="border-b border-line py-2 pr-2 text-muted">{PRIORITY_LABEL[it.priority]}</td>
                  <td className="num border-b border-line py-2 pr-2 text-right text-ink-2">{w}</td>
                  <td className="border-b border-line py-2 pr-2 text-ink-2">{LEVEL_LABEL[f]}</td>
                  <td className={`border-b border-line py-2 pr-2 ${s !== f ? "font-semibold text-accent" : "text-ink-2"}`}>{LEVEL_LABEL[s]}</td>
                  <td className="border-b border-line py-2 text-muted">
                    {!arg ? (f === "met" ? "액면 충족" : "논증 없음") : arg.counted ? "반영" : "미반영"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold text-ink">
                <td className="py-2 pr-2" colSpan={2}>합계</td>
                <td className="num py-2 pr-2 text-right">{total}</td>
                <td className="num py-2 pr-2">{facePts} → {total > 0 ? Math.round((facePts / total) * 100) : 0}%</td>
                <td className="num py-2 pr-2">{storyPts} → {total > 0 ? Math.round((storyPts / total) * 100) : 0}%</td>
                <td className="py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </details>
  );
}
