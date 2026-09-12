const GET = [
  "부서장이 뽑으려는 사람 분석",
  "내 이력 기준 액면 충족률",
  "근거가 붙은 갈음 논증과 스토리보완 후 충족률",
  "80%까지의 보강 로드맵",
  "지원 · 보류 · 비추천 판정",
];

const NOT = ["자소서 자동 생성", "합격 보장", "근거 없는 점수 올려주기"];

export function Honesty() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="card p-5 sm:p-6" aria-labelledby="honesty-get">
        <h3 id="honesty-get" className="text-base font-bold text-ink">
          받는 것
        </h3>
        <ul className="mt-4 space-y-2.5">
          {GET.map((t) => (
            <li key={t} className="flex gap-3 text-sm leading-6 text-ink">
              <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </section>
      <section className="card p-5 sm:p-6" aria-labelledby="honesty-not">
        <h3 id="honesty-not" className="text-base font-bold text-ink">
          받지 않는 것
        </h3>
        <ul className="mt-4 space-y-2.5">
          {NOT.map((t) => (
            <li key={t} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="mt-2.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-faint" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-muted">
          점수는 합격을 보장하지 않습니다. 부서장 관점의 추정이며, 근거 없는 항목은 반영하지 않습니다. 이 앱이 하는 일은 지원 여부를
          판단할 근거를 만드는 것까지입니다.
        </p>
      </section>
    </div>
  );
}
