import {
  assembleAnalysis,
  toBasicResume,
  toManagerView,
  toStoryResume,
  toTargetResume,
} from "./assemble";
import type { BasicStage, ManagerStage, StoryStage, TargetStage } from "./schemas";
import type { Analysis, AnalysisMode, CandidateInput, JobPosting } from "./types";

/**
 * 데모 샘플 — Intel · Gaming Application Engineer 공고에
 * 게임사 경력이 없는 그래픽스 전공 취준생이 지원한 경우.
 * 4단계 원시 출력을 실제 파이프라인과 같은 조립 경로로 통과시킨다.
 */

export const SAMPLE_ID = "sample";

const posting: JobPosting = {
  company: "Intel Korea",
  title: "Gaming Application Engineer",
  jdText: `Intel Korea · Gaming Application Engineer (게이밍 애플리케이션 엔지니어)

[주요 업무]
- 국내 게임 개발사와의 기술 협력: Intel CPU/GPU 플랫폼에서 게임 성능 최적화 지원
- 게임 타이틀의 성능 프로파일링, 병목 분석 및 최적화 가이드 제공
- 개발사 엔지니어 대상 기술 워크숍·세미나 진행, 기술 문서 작성
- 본사 엔지니어링 팀과 협업하여 이슈 리포트 및 드라이버 피드백 전달
- 파트너사 관계 관리 및 기술 지원 요청 대응

[자격 요건]
- 컴퓨터공학 또는 관련 전공 학사 이상
- 게임 개발 경력 5년 이상
- C++ 및 그래픽스 API(DirectX 12, Vulkan) 이해
- 게임 엔진(Unreal Engine, Unity) 실무 경험
- 성능 프로파일링·최적화 경험 (PIX, RenderDoc, Nsight 등)
- 영어로 기술 커뮤니케이션 가능 (본사 협업)

[우대 사항]
- GPU 아키텍처 및 드라이버 동작 이해
- 파트너사 대상 기술 지원 또는 데브렐 경험
- 기술 문서 작성 및 발표 경험
- 국내외 출장 가능`,
};

const candidate: CandidateInput = {
  resumeText: `이름: 김도윤 (가명)

학력
- 한국대학교 컴퓨터공학과 학사 (2019.03 – 2025.02), 학점 3.7/4.5
- 컴퓨터그래픽스, 게임프로그래밍, 운영체제, 컴퓨터구조 수강
- 2023 가을학기 미국 대학 교환학생 (Computer Graphics 수업 팀 프로젝트, 영어 발표 2회)

프로젝트
- 2024.03 – 2024.11 졸업 프로젝트 「Aurora」 자체 C++ 렌더링 엔진 (4인 팀, 렌더러 담당)
  - Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 매핑
  - RenderDoc과 Nsight Graphics로 프레임 병목을 분석해 드로우콜 배칭과 디스크립터 캐싱으로 평균 프레임 시간 20% 단축 (1080p 기준 41fps → 49fps)
  - 교내 SW 전시회 우수상
- 2024.06 – 개인 블로그 「인기 게임 5종의 그래픽 파이프라인 분석」 연재 (엘든 링, 젤다 왕눈, 발로란트, 배틀그라운드, 원신의 렌더링 기법과 최적화 포인트 정리, 누적 조회 1.2만)
- 2023.08 Unity 인디 게임잼 48시간 참여 (4인 팀, 클라이언트 프로그래밍 담당, 2D 액션 게임 완성)
- 2023.05 오픈소스 렌더링 엔진 bgfx 에 버그 수정 PR 1건 머지 (Vulkan 백엔드 리소스 해제 순서 문제)

경력
- 2022.07 – 2022.09 ○○테크 (B2B SaaS 스타트업) 기술지원 인턴 3개월
  - 고객사 개발자 문의 대응 (주 15건 내외), 재현 환경 구성, 이슈 트래킹 및 개발팀 전달
  - 자주 묻는 기술 문의를 정리한 FAQ 문서 작성

자격·어학
- 정보처리기사 (2024.11)
- TOEIC 900 (2024.05), OPIc IH (2024.06)
- 기타: 국내외 출장 가능, 병역 필`,
};

const manager: ManagerStage = {
  company: "Intel Korea",
  title: "Gaming Application Engineer",
  actualWork:
    "국내 게임 개발사가 Intel 플랫폼(CPU·GPU)에서 게임 성능을 끌어올리도록 현장에서 돕는 일이다. 개발사 엔지니어와 함께 프레임을 프로파일링해 병목을 찾고 최적화 가이드를 주며, 그 과정에서 드러난 드라이버·하드웨어 이슈를 본사 엔지니어링 팀에 정확히 전달한다.",
  personProfile: "게임사 핵심 엔지니어와 막힘없이 기술 대화를 나누며 성능 문제를 함께 푸는 AE",
  personTraits: [
    "렌더링 파이프라인 수준에서 성능 문제를 읽는다",
    "도구로 병목을 찾아 숫자로 개선해 본 경험이 있다",
    "외부 개발자의 문제를 받아 정리하고 해결까지 끌고 간다",
    "본사 엔지니어와 영어로 기술 이슈를 주고받는다",
    "게임 개발 현장의 언어와 관행을 안다",
  ],
  managerQuestions: [
    "게임사 엔지니어와 기술 대화가 되는가?",
    "프레임 병목을 직접 찾아 개선해 본 적이 있는가?",
    "외부 개발자를 상대로 기술 지원을 끝까지 해 본 적이 있는가?",
    "본사 엔지니어와 영어로 기술 이슈를 주고받을 수 있는가?",
  ],
  items: [
    {
      label: "게임 개발 경력 5년 이상",
      priority: "required",
      weight: 5,
      intent: "게임사 핵심 엔지니어와 막힘없이 기술 대화를 나누고, 그들의 문제를 즉시 이해하는 능력",
      signal: "게임 개발 현장의 기술 맥락(엔진·파이프라인·최적화 관행)을 실제로 다뤄 본 흔적",
      hardGate: false,
    },
    {
      label: "C++ 및 그래픽스 API(DX12/Vulkan) 이해",
      priority: "required",
      weight: 5,
      intent: "렌더링 파이프라인 수준에서 성능 문제를 읽고 개발사 코드에 대해 말할 수 있는 능력",
      signal: "Vulkan/DX12로 직접 만든 렌더러나 최적화 사례",
      hardGate: false,
    },
    {
      label: "성능 프로파일링·최적화 경험",
      priority: "required",
      weight: 4,
      intent: "도구로 병목을 찾아 수치로 개선해 본 경험",
      signal: "어떤 도구로 무엇을 몇 % 개선했는가",
      hardGate: false,
    },
    {
      label: "게임 엔진(Unreal/Unity) 실무 경험",
      priority: "required",
      weight: 4,
      intent: "개발사가 쓰는 엔진 구조 안에서 문제를 재현하고 해법을 제시할 수 있는 능력",
      signal: "엔진 안에서 실제로 완성해 본 산출물과 그 규모",
      hardGate: false,
    },
    {
      label: "영어 기술 커뮤니케이션",
      priority: "required",
      weight: 3,
      intent: "본사 엔지니어와 기술 이슈를 영어로 주고받을 수 있는가",
      signal: "어학 점수보다, 영어로 기술 내용을 발표·문서화·토론한 경험",
      hardGate: false,
    },
    {
      label: "컴퓨터공학 학사 이상",
      priority: "required",
      weight: 2,
      intent: "그래픽스·시스템 기본기가 있는가",
      signal: "전공·학위·관련 과목",
      hardGate: true,
    },
    {
      label: "GPU 아키텍처·드라이버 이해",
      priority: "preferred",
      weight: 3,
      intent: "드라이버 피드백을 본사에 정확히 전달할 수 있는 깊이",
      signal: "GPU 파이프라인 단계별 병목(버텍스·픽셀·메모리 대역폭)을 분석해 본 경험",
      hardGate: false,
    },
    {
      label: "파트너사 기술 지원·데브렐 경험",
      priority: "preferred",
      weight: 3,
      intent: "외부 개발자의 문제를 받아 정리하고 해결까지 끌고 가는 능력",
      signal: "외부 고객·개발자 대응 이력과 처리 규모",
      hardGate: false,
    },
    {
      label: "기술 문서 작성·발표 경험",
      priority: "preferred",
      weight: 2,
      intent: "워크숍·세미나·문서로 지식을 전달할 수 있는가",
      signal: "작성한 문서·발표 산출물과 독자 규모",
      hardGate: false,
    },
    {
      label: "국내외 출장 가능",
      priority: "preferred",
      weight: 1,
      intent: "개발사 현장 방문과 본사 출장이 가능한가",
      signal: "명시 여부",
      hardGate: false,
    },
  ],
};

const basic: BasicStage = {
  summary: "컴퓨터공학 학사(2025.02 졸업). 자체 C++/Vulkan 렌더링 엔진 프로젝트와 게임 그래픽 분석 연재, 기술지원 인턴 3개월. 게임사 근무 경력은 없다.",
  sections: [
    {
      title: "학력",
      entries: [
        { period: "2019.03 – 2025.02", title: "한국대학교 컴퓨터공학과 학사", detail: "학점 3.7/4.5. 컴퓨터그래픽스·게임프로그래밍·운영체제·컴퓨터구조 수강." },
        { period: "2023 가을", title: "미국 대학 교환학생", detail: "Computer Graphics 수업 팀 프로젝트, 영어 발표 2회." },
      ],
    },
    {
      title: "프로젝트",
      entries: [
        { period: "2024.03 – 2024.11", title: "졸업 프로젝트 「Aurora」 자체 C++ 렌더링 엔진 (렌더러 담당)", detail: "Vulkan 디퍼드 렌더러·PBR·섀도 매핑 구현. RenderDoc·Nsight Graphics로 병목 분석, 드로우콜 배칭·디스크립터 캐싱으로 평균 프레임 시간 20% 단축(41→49fps). 교내 SW 전시회 우수상." },
        { period: "2024.06 –", title: "블로그 연재 「인기 게임 5종의 그래픽 파이프라인 분석」", detail: "엘든 링·젤다·발로란트·배틀그라운드·원신의 렌더링 기법과 최적화 포인트 정리. 누적 조회 1.2만." },
        { period: "2023.08", title: "Unity 인디 게임잼 48시간", detail: "4인 팀 클라이언트 프로그래밍 담당, 2D 액션 게임 완성." },
        { period: "2023.05", title: "오픈소스 bgfx 버그 수정 PR 머지", detail: "Vulkan 백엔드 리소스 해제 순서 문제 수정." },
      ],
    },
    {
      title: "경력",
      entries: [
        { period: "2022.07 – 2022.09", title: "○○테크 기술지원 인턴 (3개월)", detail: "고객사 개발자 문의 주 15건 대응, 재현 환경 구성, 이슈 트래킹·개발팀 전달, FAQ 문서 작성." },
      ],
    },
    {
      title: "자격·어학",
      entries: [
        { period: "2024", title: "정보처리기사 · TOEIC 900 · OPIc IH", detail: "국내외 출장 가능, 병역 필." },
      ],
    },
  ],
  matches: [
    { itemId: "j1", level: "unmet", evidence: null, note: "게임 개발사 근무 경력이 없다. 액면으로는 0년." },
    { itemId: "j2", level: "met", evidence: "Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 매핑", note: "C++로 Vulkan 렌더러를 직접 구현했다. 액면 충족." },
    { itemId: "j3", level: "met", evidence: "RenderDoc과 Nsight Graphics로 프레임 병목을 분석해 드로우콜 배칭과 디스크립터 캐싱으로 평균 프레임 시간 20% 단축", note: "도구와 수치가 있는 최적화 경험. 액면 충족." },
    { itemId: "j4", level: "partial", evidence: "Unity 인디 게임잼 48시간 참여", note: "Unity는 48시간 게임잼 1회뿐이고 Unreal 경험이 없다. 실무 경험이라 보기 어렵다." },
    { itemId: "j5", level: "partial", evidence: "TOEIC 900 (2024.05), OPIc IH (2024.06)", note: "어학 점수는 있으나 영어로 기술 이슈를 주고받은 실무 경험은 없다." },
    { itemId: "j6", level: "met", evidence: "한국대학교 컴퓨터공학과 학사", note: "전공 학사 충족." },
    { itemId: "j7", level: "unmet", evidence: null, note: "GPU 아키텍처나 드라이버를 다룬 흔적이 없다." },
    { itemId: "j8", level: "partial", evidence: "고객사 개발자 문의 대응 (주 15건 내외), 재현 환경 구성, 이슈 트래킹 및 개발팀 전달", note: "기술지원 인턴 3개월. 게임 개발사 대상은 아니다." },
    { itemId: "j9", level: "met", evidence: "「인기 게임 5종의 그래픽 파이프라인 분석」 연재", note: "연재 문서(누적 조회 1.2만)와 FAQ 문서, 영어 발표 2회. 액면 충족." },
    { itemId: "j10", level: "met", evidence: "국내외 출장 가능", note: "명시돼 있다." },
  ],
};

const story: StoryStage = {
  headline: "게임사 엔지니어와 렌더링 파이프라인 수준의 기술 대화가 가능한 그래픽스 엔지니어",
  answers: [
    {
      question: "게임사 엔지니어와 기술 대화가 되는가?",
      answer: "게임사 근무 이력은 없지만, 렌더링 파이프라인을 직접 구현하고 상용 게임의 렌더링 기법을 분석해 온 만큼 엔진 수준의 기술 대화가 가능하다.",
      bullets: [
        "Vulkan 기반 디퍼드 렌더러(PBR·섀도 매핑) 직접 구현 — 졸업 프로젝트 Aurora, 2024",
        "인기 게임 5종의 그래픽 파이프라인 분석 연재, 누적 조회 1.2만 — 2024",
        "오픈소스 렌더링 엔진 bgfx Vulkan 백엔드 버그 수정 PR 머지 — 2023",
      ],
    },
    {
      question: "프레임 병목을 직접 찾아 개선해 본 적이 있는가?",
      answer: "RenderDoc과 Nsight Graphics로 병목을 분석하고 구조를 바꿔 수치로 개선했다.",
      bullets: ["드로우콜 배칭·디스크립터 캐싱으로 평균 프레임 시간 20% 단축 (1080p 41fps → 49fps) — Aurora, 2024"],
    },
    {
      question: "외부 개발자를 상대로 기술 지원을 끝까지 해 본 적이 있는가?",
      answer: "B2B SaaS 기술지원 인턴으로 외부 개발자의 문의를 받아 재현하고 개발팀에 전달하는 과정을 3개월간 반복했다.",
      bullets: [
        "고객사 개발자 문의 주 15건 대응, 재현 환경 구성, 이슈 트래킹·개발팀 전달 — 2022",
        "자주 묻는 기술 문의를 FAQ 문서로 정리 — 2022",
      ],
    },
    {
      question: "본사 엔지니어와 영어로 기술 이슈를 주고받을 수 있는가?",
      answer: "교환학생 Computer Graphics 팀 프로젝트에서 영어 발표를 했고 TOEIC 900·OPIc IH가 있다. 다만 실무 수준의 근거로는 약하다.",
      bullets: ["Computer Graphics 수업 팀 프로젝트, 영어 발표 2회 — 2023", "TOEIC 900, OPIc IH — 2024"],
    },
  ],
  arguments: [
    {
      itemId: "j1",
      claim: "경력 5년 → 게임 기술 특성 이해 + 핵심 기술 프로젝트",
      argument:
        "부서장이 경력 5년으로 담보하려던 것은 게임사 엔지니어와 막힘없이 기술 대화를 나누는 능력이다. 상용 게임 5종의 렌더링 파이프라인을 분석해 정리했고, Vulkan 디퍼드 렌더러를 직접 구현했으며, 오픈소스 렌더링 엔진에 기여했다. 게임 개발의 핵심 기술을 다뤄 봤으므로 엔진 수준의 대화는 가능하다. 다만 상용 타이틀 출시 경험은 없어 부분 충족까지다.",
      evidence: [
        { quote: "Vulkan 기반 디퍼드 렌더러 구현, PBR 머티리얼, 섀도 매핑", source: "졸업 프로젝트 Aurora (2024)" },
        { quote: "인기 게임 5종의 그래픽 파이프라인 분석", source: "블로그 연재 (2024.06 –)" },
        { quote: "오픈소스 렌더링 엔진 bgfx 에 버그 수정 PR 1건 머지", source: "오픈소스 기여 (2023.05)" },
      ],
      evidenceStatus: "grounded",
      level: "partial",
      note: "근거 있음 — 부분 충족으로 반영. 상용 타이틀 경험이 없어 충족까지는 올리지 않았다.",
    },
    {
      itemId: "j4",
      claim: "엔진 실무 경험 → 엔진 구조 이해 + 게임잼 완성 경험",
      argument:
        "자체 엔진을 만들어 봤기에 상용 엔진의 렌더링 구조를 빠르게 읽을 수 있고, Unity 게임잼에서 클라이언트를 맡아 게임을 완성했다.",
      evidence: [{ quote: "Unity 인디 게임잼 48시간 참여 (4인 팀, 클라이언트 프로그래밍 담당, 2D 액션 게임 완성)", source: "게임잼 (2023.08)" }],
      evidenceStatus: "weak",
      level: "partial",
      note: "근거 부족 — 점수 미반영. 48시간 게임잼 1회로 실무 경험을 갈음하기엔 약하고, Unreal 경험이 없다.",
    },
    {
      itemId: "j5",
      claim: "영어 기술 커뮤니케이션 → 영어 기술 발표 경험",
      argument: "교환학생 Computer Graphics 팀 프로젝트에서 영어로 기술 발표를 두 차례 했다. 어학 점수(TOEIC 900, OPIc IH)도 갖추고 있다.",
      evidence: [{ quote: "Computer Graphics 수업 팀 프로젝트, 영어 발표 2회", source: "교환학생 (2023 가을)" }],
      evidenceStatus: "weak",
      level: "partial",
      note: "근거 부족 — 점수 미반영. 수업 발표 2회는 본사 엔지니어와의 기술 협업을 담보하기엔 약하다.",
    },
    {
      itemId: "j7",
      claim: "GPU 아키텍처 이해 → 프레임 병목 분석 실습",
      argument: "Nsight Graphics로 프레임 병목을 분석한 경험이 있어 GPU 파이프라인의 단계별 동작을 실습 수준에서 안다.",
      evidence: [{ quote: "RenderDoc과 Nsight Graphics로 프레임 병목을 분석해", source: "졸업 프로젝트 Aurora (2024)" }],
      evidenceStatus: "weak",
      level: "partial",
      note: "근거 부족 — 점수 미반영. 프로파일링 도구 사용은 있으나 GPU 아키텍처·드라이버 동작을 다룬 근거가 아니다.",
    },
    {
      itemId: "j8",
      claim: "파트너사 기술 지원 → 외부 개발자 이슈 대응 프로세스 경험",
      argument:
        "게임사 대상은 아니지만 외부 개발자의 문의를 받아 재현하고 개발팀에 전달하는 기술 지원의 전 과정을 3개월간 수행했다. FAQ 문서화까지 했으므로 부서장이 원하는 '문제를 받아 끝까지 끌고 가는' 능력의 근거가 된다.",
      evidence: [
        { quote: "고객사 개발자 문의 대응 (주 15건 내외), 재현 환경 구성, 이슈 트래킹 및 개발팀 전달", source: "기술지원 인턴 (2022.07 – 2022.09)" },
        { quote: "자주 묻는 기술 문의를 정리한 FAQ 문서 작성", source: "기술지원 인턴 (2022)" },
      ],
      evidenceStatus: "grounded",
      level: "met",
      note: "근거 있음 — 충족으로 반영. 처리 건수와 프로세스가 원문에 있다.",
    },
  ],
  resumeMarkdown: `# 김도윤 — 게임사 엔지니어와 렌더링 파이프라인 수준의 기술 대화가 가능한 그래픽스 엔지니어

컴퓨터공학 학사 · C++/Vulkan 렌더링 엔진 개발 · 게임 그래픽 파이프라인 분석 연재 · 기술지원 경험

## 게임사 엔지니어와 기술 대화가 되는가
- **Vulkan 기반 디퍼드 렌더러 직접 구현** — PBR 머티리얼, 섀도 매핑 (졸업 프로젝트 Aurora, 2024, 4인 팀 렌더러 담당)
- **인기 게임 5종의 그래픽 파이프라인 분석 연재** — 엘든 링·젤다·발로란트·배틀그라운드·원신의 렌더링 기법과 최적화 포인트 정리, 누적 조회 1.2만 (2024)
- **오픈소스 렌더링 엔진 bgfx 기여** — Vulkan 백엔드 리소스 해제 순서 버그 수정 PR 머지 (2023)

## 프레임 병목을 직접 찾아 개선해 본 적이 있는가
- RenderDoc·Nsight Graphics로 프레임 병목 분석 → 드로우콜 배칭·디스크립터 캐싱으로 **평균 프레임 시간 20% 단축** (1080p 41fps → 49fps, Aurora 2024)

## 외부 개발자를 상대로 기술 지원을 끝까지 해 본 적이 있는가
- ○○테크 기술지원 인턴 (2022.07 – 2022.09) — 고객사 개발자 문의 **주 15건** 대응, 재현 환경 구성, 이슈 트래킹·개발팀 전달
- 자주 묻는 기술 문의를 FAQ 문서로 정리

## 프로젝트
- **Aurora** 자체 C++ 렌더링 엔진 (2024.03 – 2024.11) — Vulkan 디퍼드 렌더러·PBR·섀도 매핑, 교내 SW 전시회 우수상
- **Unity 인디 게임잼 48시간** (2023.08) — 4인 팀 클라이언트 프로그래밍, 2D 액션 게임 완성

## 학력·어학·자격
- 한국대학교 컴퓨터공학과 학사 (2019.03 – 2025.02, 3.7/4.5) — 컴퓨터그래픽스·게임프로그래밍·운영체제·컴퓨터구조
- 미국 대학 교환학생 (2023 가을) — Computer Graphics 팀 프로젝트, 영어 발표 2회
- TOEIC 900 · OPIc IH · 정보처리기사 · 국내외 출장 가능`,
};

const target: TargetStage = {
  gaps: [
    {
      itemId: "j5",
      category: "hidden",
      title: "영어 기술 커뮤니케이션 실증",
      action: "교환학생·오픈소스·인턴 기간에 영어로 기술 토론을 한 사실이 있다면 이력에 구체적으로 적는다. 특히 bgfx PR 리뷰는 영어로 진행됐을 가능성이 높다.",
      effort: "days",
      questions: [
        "bgfx 버그 수정 PR에서 메인테이너와 영어로 코드 리뷰를 주고받았나요? 몇 차례 어떤 내용이었나요?",
        "교환학생 팀 프로젝트에서 영어로 설계 토론이나 코드 리뷰를 한 적이 있나요?",
        "인턴 기간에 해외 고객사나 영문 문서로 대응한 문의가 있었나요?",
      ],
      alternativePath: null,
    },
    {
      itemId: "j7",
      category: "weak",
      title: "GPU 병목 분석 자료 구체화",
      action: "Aurora 최적화 과정의 Nsight 캡처를 정리해 GPU 파이프라인 단계별(버텍스·픽셀·메모리 대역폭) 병목 분석 글 1편을 블로그 연재에 추가하고, 이력에 링크와 핵심 수치를 붙인다.",
      effort: "weeks",
      questions: null,
      alternativePath: null,
    },
    {
      itemId: "j4",
      category: "weak",
      title: "게임잼 산출물 구체화",
      action: "게임잼 결과물의 플레이 영상·저장소 링크를 붙이고, 담당한 시스템(입력·애니메이션·충돌)과 코드 규모를 이력에 명시한다.",
      effort: "days",
      questions: null,
      alternativePath: null,
    },
    {
      itemId: "j4",
      category: "missing",
      title: "Unreal 렌더링 플러그인 4주 프로젝트",
      action: "Unreal Engine 5에서 커스텀 렌더 패스 플러그인 하나를 완성하고 Unreal Insights로 프로파일링한 결과를 정리한다. 상용 엔진 구조 안에서 문제를 재현·해결한 근거가 된다.",
      effort: "weeks",
      questions: null,
      alternativePath: null,
    },
    {
      itemId: "j1",
      category: "hard",
      title: "게임 개발 경력 5년",
      action: "경력 연수는 단기간에 만들 수 없다. 미충족으로 표시하되, 부서장이 담보하려던 '기술 대화 능력'을 직접 입증하는 경로를 택한다.",
      effort: "months",
      questions: null,
      alternativePath:
        "게임사 기술협력·최적화 인턴이나 계약직으로 현장 경험을 쌓거나, 게임 개발자 밋업에서 렌더링 최적화 발표를 해 게임사 엔지니어와의 기술 대화를 공개적으로 증명한다.",
    },
  ],
  timeline: "4~6주 (①②는 1주 내, ③은 4주)",
  resumeMarkdown: `# 김도윤 — 게임사 엔지니어와 렌더링 파이프라인 수준의 기술 대화가 가능한 그래픽스 엔지니어

## 게임사 엔지니어와 기술 대화가 되는가
- Vulkan 기반 디퍼드 렌더러 직접 구현 — PBR·섀도 매핑 (Aurora, 2024)
- 인기 게임 5종의 그래픽 파이프라인 분석 연재, 누적 조회 1.2만 (2024)
- [보강 예정] GPU 파이프라인 단계별 병목 분석 — Nsight 캡처 기반 버텍스·픽셀·메모리 대역폭 분석 1편
- 오픈소스 bgfx Vulkan 백엔드 버그 수정 PR 머지 (2023)

## 프레임 병목을 직접 찾아 개선해 본 적이 있는가
- RenderDoc·Nsight Graphics 병목 분석 → 평균 프레임 시간 20% 단축 (41fps → 49fps)
- [보강 예정] Unreal Engine 5 커스텀 렌더 패스 플러그인 + Unreal Insights 프로파일링 결과

## 외부 개발자를 상대로 기술 지원을 끝까지 해 본 적이 있는가
- 기술지원 인턴 — 고객사 개발자 문의 주 15건 대응, 재현·트래킹·개발팀 전달, FAQ 문서화 (2022)

## 본사 엔지니어와 영어로 기술 이슈를 주고받을 수 있는가
- [보강 예정] bgfx PR 영어 코드 리뷰 왕복 내역 / 교환학생 영어 설계 토론 사실 확인 후 기재
- 교환학생 Computer Graphics 팀 프로젝트 영어 발표 2회 · TOEIC 900 · OPIc IH

## 프로젝트·학력
- Aurora 자체 C++ 렌더링 엔진 (2024) · Unity 게임잼 2D 액션 게임 완성 (2023) [보강 예정: 플레이 영상·저장소 링크·담당 시스템 명시]
- 한국대학교 컴퓨터공학과 학사 (2025.02) · 정보처리기사 · 국내외 출장 가능

## 미충족 표시
- 게임 개발 경력 5년: 미충족. 대안 경로 — 게임사 기술협력 인턴·계약직, 게임 개발자 밋업 렌더링 최적화 발표`,
};

const verdictReason =
  "보류다. 스토리보완 후 72%로 합격선 80%까지 8%p 부족하지만, 보강 로드맵으로 닿을 수 있는 거리다. 경력 5년 항목은 렌더링 엔진 프로젝트와 게임 그래픽 분석으로 부분 갈음됐고 파트너 기술 지원은 인턴 이력으로 충족됐지만, 엔진 실무·영어 기술 커뮤니케이션·GPU 아키텍처는 근거가 약해 점수에 넣지 않았다. 목표 이력서의 ① 영어 기술 커뮤니케이션 사실 확인과 ② GPU 병목 분석 자료 구체화부터 채운 뒤 지원한다.";

export const SAMPLE_STAGES = { posting, candidate, manager, basic, story, target, verdictReason };

export function buildSampleAnalysis(opts?: { id?: string; createdAt?: string; mode?: AnalysisMode }): Analysis {
  const view = toManagerView(manager);
  const basicResume = toBasicResume(basic, view);
  const storyResume = toStoryResume(story, view, basicResume, candidate.resumeText);
  const targetResume = toTargetResume(target, view, basicResume, storyResume);
  const a = assembleAnalysis({
    id: opts?.id ?? SAMPLE_ID,
    createdAt: opts?.createdAt ?? "2026-09-01T09:00:00.000Z",
    mode: opts?.mode ?? "demo",
    posting,
    candidate,
    managerView: view,
    basicResume,
    storyResume,
    targetResume,
    verdictReason,
  });
  return { ...a, unlocked: true, unlockedBy: "sample" };
}
