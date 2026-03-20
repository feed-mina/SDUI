"use client";

const PAGE_URL = "https://bts-gwanghwamun.vercel.app";
const TEXT = "💜 BTS 광화문 현장 지도 — 24h 카페·충전·구급·지하철 루트";

export default function LineShare() {
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(PAGE_URL)}&text=${encodeURIComponent(TEXT)}`;

  return (
    <a
      href={lineUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="info-btn line"
    >
      🟢 LINE 공유
    </a>
  );
}
