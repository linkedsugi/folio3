"use client";

import { useState } from "react";
import { Button } from "./ui";

export function CopyButton({ text, label = "복사하기", size = "sm", variant = "secondary" as const }: { text: string; label?: string; size?: "sm" | "md"; variant?: "primary" | "secondary" | "ghost" }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          window.prompt("아래 내용을 복사하세요", text);
        }
      }}
    >
      {done ? "복사됨" : label}
    </Button>
  );
}

export function DownloadButton({ text, filename, label = "텍스트로 저장" }: { text: string; filename: string; label?: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => {
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      {label}
    </Button>
  );
}
