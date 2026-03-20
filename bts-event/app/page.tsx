"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import LayerFilter, { type Layer } from "@/components/Map/LayerFilter";
import InfoPanel from "@/components/InfoPanel";
import LangToggle, { type Lang } from "@/components/LangToggle";
import GuestChat from "@/components/Chat/GuestChat";
import FanBoard from "@/components/Board/FanBoard";

// KakaoMap must be loaded client-side only (no SSR)
const KakaoMap = dynamic(() => import("@/components/Map/KakaoMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ color: "var(--text-secondary)" }}
    >
      지도 로딩 중...
    </div>
  ),
});

type Tab = "map" | "chat" | "board";

const TABS: { key: Tab; label: string }[] = [
  { key: "map",   label: "🗺️ 지도" },
  { key: "chat",  label: "🤖 채팅" },
  { key: "board", label: "✍️ 게시판" },
];

export default function HomePage() {
  const [tab, setTab]       = useState<Tab>("map");
  const [lang, setLang]     = useState<Lang>("ko");
  const [layers, setLayers] = useState<Set<Layer>>(
    new Set<Layer>(["cafe", "charging", "emergency", "subway"])
  );

  const toggleLayer = (layer: Layer) => {
    setLayers((prev) => {
      const next = new Set(prev);
      next.has(layer) ? next.delete(layer) : next.add(layer);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="app-header">
        <h1>💜 BTS 광화문</h1>
        <div className="flex items-center gap-2">
          <div className="tab-bar">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`tab-btn ${tab === key ? "active" : ""}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <LangToggle lang={lang} onChange={setLang} />
        </div>
      </header>

      {/* Layer filter — map tab only */}
      {tab === "map" && (
        <LayerFilter active={layers} onToggle={toggleLayer} />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {tab === "map" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <KakaoMap activeLayers={layers} lang={lang} />
            </div>
            <InfoPanel />
          </div>
        )}
        {tab === "chat"  && <GuestChat />}
        {tab === "board" && <FanBoard />}
      </main>
    </div>
  );
}
