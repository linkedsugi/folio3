import type { BasicResume, ManagerView, StoryResume, Verdict } from "../types";
import { LEVEL_LABEL, PRIORITY_LABEL, VERDICT_LABEL, storyLevelMap } from "../scoring";

export const SYSTEM_PROMPT = `당신은 RoleFit Canvas 의 분석 엔진이다. 취준생의 지원 판단을 돕되, 판단은 냉정해야 한다.

핵심 논지: JD는 한 사람이 해낼 실제 역할을 항목으로 해체해 놓은 문서다. 지원 판단은 항목을 하나씩 맞추는 일이 아니라, 뽑는 부서장의 눈으로 그 역할을 복원하고, 부서장에게 내가 그 역할을 해낼 수 있다는 근거를 세운 뒤, 합격 가능성을 냉정하게 재는 일이다.

원칙 1. JD는 뽑는 부서장의 관점에서 바라본다. 지원자의 눈으로 항목을 맞추지 않는다. 부서에는 실제 일이 하나 있고, 부서장은 그 일을 해낼 한 사람이 필요하다. JD 항목은 "그 사람이 이 일을 하려면 무엇이 필요할까"를 풀어 적은 것이며, 각 항목은 어떤 실제 능력을 담보하려는 표지다. 예: 인텔이 게임사 기술협력 AE를 뽑으며 "게임개발 경력 5년"을 적었다면 부서장이 원한 것은 숫자 5년이 아니라, 게임사 핵심 엔지니어와 막힘없이 기술 대화를 나눌 수 있는 사람이다.

원칙 2. 이력서는 뽑는 부서장이 원하고 좋아하는 이력서를 쓴다. 독자는 인사팀도 지원자 본인도 아닌 부서장이다. 부서장이 읽고 싶은 것은 한 일의 목록이 아니라 "이 사람이 우리 일을 해낼 수 있는가"의 답이다.

냉정함의 규칙. 갈음 주장마다 이력 속 실제 경험이 근거로 붙어야 하고, 근거 없는 주장은 점수에 반영하지 않는다. 이력 원문에 없는 사실을 만들어 내지 않는다. 인용은 원문 그대로 한다. 과장하지 않는다. 그래야 80%가 희망이 아니라 판단이 된다.

출력 언어: 한국어 (고유명사·기술 용어는 원문 표기 유지). 취준생이 화면에서 읽는 설명·논증·판정 근거·보강 행동(actualWork, intent, signal, note, argument, answer, action, alternativePath, verdictReason)은 존댓말("~합니다/~입니다")로 간결하게 쓴다. 이력서 본문(resumeMarkdown)과 bullets, label, claim, personProfile, personTraits, title 은 명사형·간결체로 쓴다. 이모지와 느낌표를 쓰지 않는다.`;

export function managerPrompt(jdText: string, company: string, title: string): string {
  const head = [company && `회사명(사용자 입력): ${company}`, title && `직무명(사용자 입력): ${title}`]
    .filter(Boolean)
    .join("\n");
  return `[1단계 · 부서장이 뽑으려는 사람]

아래 채용 공고(JD)를 뽑는 부서장의 자리에 서서 읽어라. 항목의 목록이 아니라 한 사람의 해체도로 읽고, 항목에서 사람을 복원하라.

답해야 하는 것:
1. 이 부서의 실제 일은 무엇인가 (actualWork)
2. 그 일을 해낼 사람은 어떤 사람인가 (personProfile 한 줄 + personTraits)
3. 부서장이 이력서를 읽으며 답을 찾는 질문은 무엇인가 (managerQuestions 2~4개, "~인가?" 형식)
4. JD의 각 항목은 어떤 실제 능력을 담보하려고 적혔는가 (items: label / priority / weight / intent / signal / hardGate)

items 규칙:
- 자격요건·우대사항·주요업무에서 부서장이 실제로 보는 항목 6~12개를 뽑는다. 주요업무 문장도 능력 요건으로 바꿔 항목화한다.
- priority: 자격요건(필수)이면 required, 우대사항이면 preferred.
- weight: 부서장이 두는 무게 1~5. 역할의 핵심에 가까울수록 높다.
- intent: 숫자나 형식이 아니라 그 항목이 담보하려는 실제 능력을 쓴다. ("경력 5년" = 게임사 핵심 엔지니어와 막힘없는 기술 대화)
- signal: 부서장이 이력서에서 실제로 확인하려는 것.
- hardGate: 자격증·면허·비자·학위 등 단기간에 대체할 수 없는 법적·제도적 요건만 true. 경력 연수는 false.
- company/title: 공고 원문에서 회사명·직무명을 찾아 채운다. 사용자 입력이 있으면 우선한다. 없으면 빈 문자열.

${head ? head + "\n\n" : ""}=== 채용 공고 원문 ===
${jdText}`;
}

function itemsBlock(view: ManagerView): string {
  return view.items
    .map(
      (it) =>
        `- ${it.id} [${PRIORITY_LABEL[it.priority]} · 무게 ${it.weight}${it.hardGate ? " · 단기 대체 불가" : ""}] ${it.label}\n    담보하려는 능력: ${it.intent}\n    확인하려는 것: ${it.signal}`,
    )
    .join("\n");
}

function viewBlock(view: ManagerView): string {
  return `=== 결과물 1 · 부서장이 뽑으려는 사람 ===
실제 일: ${view.actualWork}
사람의 상: ${view.personProfile}
특성: ${view.personTraits.join(" / ")}
부서장의 질문:
${view.managerQuestions.map((q) => `- ${q}`).join("\n")}

JD 항목과 실제 의도:
${itemsBlock(view)}`;
}

export function basicPrompt(view: ManagerView, resumeText: string): string {
  return `[2단계 · 기본 이력서 (액면 대응)]

아래 이력을 형식에 상관없이 읽고, (1) 내 이력을 그대로 정리한 기본 이력서를 만들고, (2) JD의 각 항목에 내 스펙이 액면으로 어느 정도 대응되는지 항목별로 표시하라.

규칙:
- sections: 이력 원문의 사실만으로 학력/경력/프로젝트/활동/자격·어학 등으로 정리한다. 없는 사실을 만들지 않는다. 사소한 경험도 빠뜨리지 않는다 (나중에 근거가 된다).
- matches: 모든 항목(${view.items.map((i) => i.id).join(", ")})에 대해 하나씩 낸다.
  - level 은 액면 기준이다. 항목을 문자 그대로 충족하면 met, 일부·유사만이면 partial, 대응이 없으면 unmet. 갈음 논증은 이 단계에서 하지 않는다. 낮게 나오는 것이 정상이다.
  - evidence 는 액면으로 대응되는 이력 원문 구절을 그대로 인용한다. 없으면 null.
  - note 는 왜 그 수준인지 한 문장. 냉정하게.

${viewBlock(view)}

=== 내 이력 원문 ===
${resumeText}`;
}

export function storyPrompt(view: ManagerView, basic: BasicResume, resumeText: string): string {
  const faceLines = basic.matches
    .map((m) => {
      const it = view.items.find((i) => i.id === m.itemId);
      return `- ${m.itemId} ${it?.label ?? ""}: 액면 ${LEVEL_LABEL[m.level]}${m.evidence ? ` (대응: "${m.evidence}")` : ""} — ${m.note}`;
    })
    .join("\n");
  return `[3단계 · 스토리보완 이력서 (갈음 논증)]

액면 충족률은 ${basic.faceScore}% 다. 이 숫자만 보면 지원할 이유가 없다. 이제 부서장에게, 항목을 그대로 충족하지 못해도 부서장이 그 항목으로 담보하려던 능력을 다른 경험이나 잠재력으로 갈음할 수 있음을 논증하라. 독자는 뽑는 부서장이다.

규칙 (냉정함의 규칙 — 반드시 지킨다):
- arguments: 액면이 met 이 아닌 모든 항목에 대해 하나씩 낸다. met 인 항목은 생략해도 된다.
  - claim 형식: "항목 → 갈음하는 능력" (예: "경력 5년 → 게임 기술 특성 이해 + 핵심 기술 프로젝트").
  - argument: 부서장을 설득하는 2~3문장. 부서장이 담보하려던 능력(intent)에 직접 답한다.
  - evidence: 이력 원문에서 그대로 인용한 구절(quote)과 출처(source). 바꿔 쓰거나 요약하지 않는다. 원문에 없는 문장은 절대 만들지 않는다.
  - evidenceStatus: 인용한 근거가 주장을 실제로 뒷받침하면 grounded. 관련은 있지만 약하면 weak. 없으면 none. 의심스러우면 weak 로 둔다.
  - level: grounded 일 때만 액면보다 올릴 수 있다. weak/none 이면 액면 수준을 그대로 둔다. 갈음으로 unmet → met 은 근거가 매우 강할 때만 가능하고, 보통은 partial 까지다.
  - note: 근거가 약하거나 없으면 "근거 부족 — 점수 미반영" 처럼 솔직하게 쓴다. 이런 항목이 있는 것이 정상이며, 그래야 숫자가 판단이 된다.
- headline: 부서장을 향한 한 줄. "○○할 수 있는 사람" 형식으로 사람의 상(${view.personProfile})에 대응시킨다.
- answers: 부서장의 질문(managerQuestions) 각각에 답하는 형태로 내 경험을 재배열한다. bullets 는 성과·숫자를 포함한 이력 원문 사실만.
- resumeMarkdown: 제출용 스토리보완 이력서 전문. 순서: 헤드라인 → 부서장의 질문별 근거(answers) → 경력·프로젝트(부서장이 읽고 싶은 순서로 재배열, 근거가 되는 성과 먼저) → 학력·자격·어학. 이력 원문에 없는 사실은 쓰지 않는다. 마크다운 헤더(##)와 불릿을 쓴다.

${viewBlock(view)}

=== 결과물 2-1 · 액면 대응 ===
${faceLines}

=== 내 이력 원문 ===
${resumeText}`;
}

export function targetPrompt(
  view: ManagerView,
  basic: BasicResume,
  story: StoryResume,
  provisional: Verdict | "pending",
  resumeText: string,
): string {
  const levels = storyLevelMap(basic.matches, story.arguments);
  const lines = view.items
    .map((it) => {
      const face = basic.matches.find((m) => m.itemId === it.id)?.level ?? "unmet";
      const lv = levels.get(it.id) ?? face;
      const arg = story.arguments.find((a) => a.itemId === it.id);
      const tail = arg
        ? ` / 논증: ${arg.claim} [${arg.evidenceStatus}${arg.counted ? " · 반영" : " · 미반영"}]`
        : "";
      return `- ${it.id} [${PRIORITY_LABEL[it.priority]} · 무게 ${it.weight}${it.hardGate ? " · 단기 대체 불가" : ""}] ${it.label}: 액면 ${LEVEL_LABEL[face]} → 보완 후 ${LEVEL_LABEL[lv]}${tail}`;
    })
    .join("\n");
  const gap = Math.max(0, 80 - story.storyScore);
  const verdictLine =
    provisional === "pending"
      ? "잠정 판정: 보류 또는 비추천 — 당신이 낸 보강 로드맵(①②③)으로 예상 80%에 닿으면 보류, 닿지 못하면 비추천으로 코드가 최종 결정한다."
      : `판정: ${VERDICT_LABEL[provisional]} (규칙으로 확정됨 — 80 이상 지원 / 단기 대체 불가 필수 요건 미충족은 비추천)`;
  return `[4단계 · 목표 이력서]

현재 상태: 액면 충족률 ${basic.faceScore}% → 스토리보완 후 ${story.storyScore}% · 합격선 80% (${gap > 0 ? `${gap}%p 부족` : "통과"})
${verdictLine}

보완 후에도 met 이 아닌 항목마다 무엇을 보강해야 80%가 되는지 정리하라. 부족한 부분은 반드시 네 가지로 구분한다:
- hidden: 이미 있는데 드러나지 않은 경험 → 추가 질문·사실 확인으로 발굴 (questions 2~3개 필수: 취준생에게 묻는 구체적 질문)
- weak: 관련은 있지만 근거가 약한 경험 → 자료 보완·구체화 (숫자·기간·역할·산출물을 어떻게 붙일지)
- missing: 실제로 부족한 역량·경험 → 학습·프로젝트·현장 경험 설계 (며칠/몇 주 단위의 구체적 설계)
- hard: 단기간에 대체하기 어려운 요건 → 미충족 표시 + 대안 경로 (alternativePath 필수)

규칙:
- gaps: 항목당 1~2개. 쉬운 것(hidden, weak)부터 찾는다. 이력 원문에 힌트가 있으면 hidden 으로 분류하고 질문을 만든다. 판정이 지원이어도 80% 이상을 더 올릴 보강을 1~3개는 낸다.
- action: 취준생이 다음 주에 바로 시작할 수 있을 만큼 구체적으로.
- effort: days / weeks / months.
- timeline: 전체 보강 예상 기간.
- resumeMarkdown: 보강을 마치고 제출할 목표 이력서 전문(markdown). 스토리보완 이력서의 구조를 유지하되, 아직 없는 항목은 "[보강 예정] ..." 으로 표시한다. 없는 사실을 있는 것처럼 쓰지 않는다.

${viewBlock(view)}

=== 항목별 현재 수준 ===
${lines}

=== 스토리보완 이력서 (현재) ===
${story.resumeMarkdown}

=== 내 이력 원문 ===
${resumeText}`;
}

/** 5단계(짧은 호출) · 코드가 확정한 판정에 대한 근거 문단 */
export function reasonPrompt(
  posting: { company: string; title: string },
  view: ManagerView,
  basic: BasicResume,
  story: StoryResume,
  verdict: Verdict,
  projectedScore: number,
  gapLines: string[],
): string {
  const gap = Math.max(0, 80 - story.storyScore);
  return `[판정 근거 작성]

공고: ${[posting.company, posting.title].filter(Boolean).join(" · ") || "(회사·직무 미상)"}
사람의 상: ${view.personProfile}
액면 충족률 ${basic.faceScore}% → 스토리보완 후 ${story.storyScore}% · 합격선 80% (${gap > 0 ? `${gap}%p 부족` : "통과"})
보강 로드맵(①②③)을 모두 채우면 예상 ${projectedScore}%
최종 판정 (코드가 규칙으로 확정, 바꾸지 말 것): ${VERDICT_LABEL[verdict]}

점수 미반영 논증: ${story.arguments.filter((a) => !a.counted).map((a) => a.claim).join(" / ") || "없음"}
보강 항목:
${gapLines.map((l) => `- ${l}`).join("\n")}

판정 근거를 한 문단(3~4문장)으로 존댓말("~입니다/~합니다")로 써라. 숫자와 근거를 들어 냉정하게. 위로 문구 금지. 첫 문장은 판정과 그 이유, 가운데는 무엇이 반영되고 무엇이 미반영됐는지, 마지막 문장은 다음 행동 하나.
비추천이면 첫 문장을 "이것은 역량이 아니라 이 공고와 지금 이력의 거리에 대한 판정입니다."로 시작한다.
보류면 ①②만 채웠을 때와 ③까지 채웠을 때 예상치를 언급하지 말고, 어떤 갈래를 먼저 채우면 되는지만 말한다.
지원이면 어떤 근거가 합격선을 넘게 했는지 말하고, 더 올릴 여지 하나를 언급한다.`;
}
