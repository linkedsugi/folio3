import type { Metadata } from "next";
import { HistoryList } from "@/components/history/HistoryList";

export const metadata: Metadata = { title: "내 공고" };

export default function HistoryPage() {
  return <HistoryList />;
}
