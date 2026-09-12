import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { BasicStageSchema, ManagerStageSchema, ReasonStageSchema, StoryStageSchema, TargetStageSchema } from "@/lib/schemas";
import { quoteFound, toStoryResume, toManagerView, toBasicResume, toTargetResume, verdictFor } from "@/lib/assemble";
import { SAMPLE_STAGES } from "@/lib/sample";
import { managerPrompt, basicPrompt, storyPrompt, targetPrompt, reasonPrompt } from "@/lib/ai/prompts";

for (const [n, s] of Object.entries({ ManagerStageSchema, BasicStageSchema, StoryStageSchema, TargetStageSchema, ReasonStageSchema })) {
  const f = zodOutputFormat(s as never);
  console.log("schema", n, JSON.stringify(f.schema).length, "bytes, additionalProperties false at root:", (f.schema as { additionalProperties?: boolean }).additionalProperties === false);
}
const resume = SAMPLE_STAGES.candidate.resumeText;
console.log("quoteFound exact:", quoteFound("Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 매핑", resume));
console.log("quoteFound spacing/punct diff:", quoteFound("Vulkan기반 디퍼드렌더러 구현 PBR머티리얼 섀도매핑", resume));
console.log("quoteFound fabricated:", quoteFound("Unreal Engine 5로 상용 게임 출시", resume));
console.log("quoteFound short (<12) missing:", quoteFound("경력 5년", resume));
console.log("quoteFound empty:", quoteFound("", resume));
console.log("quoteFound genuine+fabricated tail (must be false):", quoteFound("RenderDoc과 Nsight Graphics로 프레임 병목을 분석해 드로우콜 배칭과 디스크립터 캐싱으로 평균 프레임 시간 20% 단축 그리고 완전히 지어낸 문장이 뒤에 붙음", resume));
console.log("quoteFound one char changed (must be false):", quoteFound("Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 매핑!", resume), quoteFound("Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 맵핑", resume));
console.log("quoteFound 'C++' alone (must be false):", quoteFound("C++", resume), "| 'TOEIC 900' short but real:", quoteFound("TOEIC 900", resume));

// fabricated evidence gets downgraded
const view = toManagerView(SAMPLE_STAGES.manager);
const basic = toBasicResume(SAMPLE_STAGES.basic, view);
const fab = structuredClone(SAMPLE_STAGES.story);
fab.arguments[0].evidence = [{ quote: "Unreal Engine 5로 상용 게임 출시", source: "가짜" }];
const story = toStoryResume(fab, view, basic, resume);
console.log("fabricated j1 →", story.arguments[0].evidenceStatus, story.arguments[0].level, "counted", story.arguments[0].counted, "| score", story.storyScore, "(vs 72)");
// duplicate arguments for the same item: first wins everywhere
const dup = structuredClone(SAMPLE_STAGES.story);
dup.arguments.push({ ...dup.arguments[0], level: "met" });
const sd = toStoryResume(dup, view, basic, resume);
console.log("duplicate itemId args →", sd.arguments.filter(a => a.itemId === "j1").length, "arg(s) kept, score", sd.storyScore, "(expect 72)");
// projections are exact recomputations
const t = toTargetResume(SAMPLE_STAGES.target, view, basic, story);
console.log("projected minimal/recommended:", t.projectedMinimal, t.projectedScore, "| impacts", t.gaps.map(g => `${g.category}:${g.impact}`).join(" "));
// hardGate cannot be raised
const hg = structuredClone(SAMPLE_STAGES.story);
hg.arguments.push({ itemId: "j6", claim: "x", argument: "y", evidence: [{ quote: "한국대학교 컴퓨터공학과 학사", source: "s" }], evidenceStatus: "grounded", level: "met", note: "" });
const b2 = structuredClone(SAMPLE_STAGES.basic); b2.matches.find(m => m.itemId === "j6")!.level = "unmet";
const basic2 = toBasicResume(b2, view);
const s2 = toStoryResume(hg, view, basic2, resume);
const t2 = toTargetResume(SAMPLE_STAGES.target, view, basic2, s2);
console.log("hardGate unmet: j6 level", s2.arguments.find(a => a.itemId === "j6")?.level, "verdict", verdictFor(view, basic2, s2, t2));
// prompts build
console.log("prompt sizes", managerPrompt("jd", "", "").length, basicPrompt(view, resume).length, storyPrompt(view, basic, resume).length, targetPrompt(view, basic, story, "pending", resume).length, reasonPrompt({ company: "c", title: "t" }, view, basic, story, "hold", 90, ["a"]).length);
// empty items edge
const emptyView = { ...view, items: [] };
const eb = toBasicResume({ ...SAMPLE_STAGES.basic, matches: [] }, emptyView);
console.log("empty items faceScore", eb.faceScore);
