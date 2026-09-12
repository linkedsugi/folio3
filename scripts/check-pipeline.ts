import type Anthropic from "@anthropic-ai/sdk";
import { runLive } from "@/lib/ai/pipeline";
import { SAMPLE_STAGES } from "@/lib/sample";
import type { AnalyzeEvent } from "@/lib/types";

// 가짜 클라이언트: 호출 순서대로 샘플 단계 출력을 돌려준다 (스키마 검증은 실제 parse 가 하므로 여기선 형태만)
const outputs = [SAMPLE_STAGES.manager, SAMPLE_STAGES.basic, SAMPLE_STAGES.story, SAMPLE_STAGES.target, { verdictReason: SAMPLE_STAGES.verdictReason }];
let call = 0;
const prompts: string[] = [];
const fake = {
  messages: {
    stream: (params: { messages: { content: string }[]; output_config: { format: { parse: (s: string) => unknown } } }) => ({
      finalMessage: async () => {
        prompts.push(params.messages[0].content);
        const out = outputs[call++];
        // 실제 SDK 처럼 스키마 파서를 통과시킨다
        const parsed = params.output_config.format.parse(JSON.stringify(out));
        return { parsed_output: parsed, stop_reason: "end_turn" };
      },
    }),
  },
} as unknown as Anthropic;

async function main() {
const events: AnalyzeEvent[] = [];
const a = await runLive(
  { id: "mock1", posting: { company: "", title: "", jdText: SAMPLE_STAGES.posting.jdText }, candidate: SAMPLE_STAGES.candidate },
  (e) => { events.push(e); },
  fake,
);
console.log("calls:", call, "| events:", events.map((e) => e.type === "stage" ? `${e.stage}:${e.status}` : e.type).join(" "));
console.log("posting resolved:", a.posting.company, "·", a.posting.title);
console.log("face", a.basicResume.faceScore, "story", a.storyResume.storyScore, "verdict", a.verdict, "projected", a.targetResume.projectedScore);
console.log("reason:", a.verdictReason.slice(0, 40), "...");
console.log("unlocked default:", a.unlocked, "| mode", a.mode);
console.log("stage4 prompt mentions 잠정 판정:", prompts[3].includes("잠정 판정"), "| stage5 mentions 보류:", prompts[4].includes("보류"), "| stage5 has posting:", prompts[4].includes("Intel Korea · Gaming Application Engineer"));
}
main().catch((e) => { console.error(e); process.exit(1); });
