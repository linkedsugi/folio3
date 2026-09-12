import type { ReactNode } from "react";

/** 이력서용 최소 마크다운 렌더러 (헤더·불릿·문단·굵게·[보강 예정] 강조). HTML 은 해석하지 않는다. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[보강 예정[^\]]*\]|\[보강 필요[^\]]*\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else out.push(<span key={`${key}-${i++}`} className="todo">{tok}</span>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let k = 0;
  const flushList = () => {
    if (list.length) {
      nodes.push(
        <ul key={`ul-${k++}`}>
          {list.map((li, i) => (
            <li key={i}>{inline(li, `li-${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      nodes.push(<p key={`p-${k++}`}>{inline(para.join(" "), `p-${k}`)}</p>);
      para = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();
    if (t === "") {
      flushList();
      flushPara();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) {
      flushList();
      flushPara();
      const level = h[1].length;
      const content = inline(h[2], `h-${k}`);
      nodes.push(level === 1 ? <h1 key={`h-${k++}`}>{content}</h1> : level === 2 ? <h2 key={`h-${k++}`}>{content}</h2> : <h3 key={`h-${k++}`}>{content}</h3>);
      continue;
    }
    const li = /^[-*•]\s+(.*)$/.exec(t);
    if (li) {
      flushPara();
      list.push(li[1]);
      continue;
    }
    flushList();
    para.push(t);
  }
  flushList();
  flushPara();
  return <div className={`prose-resume text-[15px] leading-7 ${className}`}>{nodes}</div>;
}
