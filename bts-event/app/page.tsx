"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import LayerFilter, { type Layer } from "@/components/Map/LayerFilter";
import InfoPanel from "@/components/InfoPanel";
import LangToggle, { type Lang } from "@/components/LangToggle";
import GuestChat from "@/components/Chat/GuestChat";
import FanBoard from "@/components/Board/FanBoard";
import NoticeModal from "@/components/NoticeModal";
import StatusCard from "@/components/StatusCard";
import LivePip from "@/components/LivePip";
import CheerMode from "@/components/CheerMode";
import { Bell } from "lucide-react";

// LeafletMap must be loaded client-side only (no SSR)
const LeafletMap = dynamic(() => import("@/components/Map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full bg-[#1a1a2e]"
      style={{ color: "var(--text-secondary)" }}
    >
      🗺️ 지도 로딩 중...
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
  const [showNotice, setShowNotice] = useState(false);
  const [showCheer, setShowCheer]   = useState(false);

  // Auto-show notice on first load
  useEffect(() => {
    const timer = setTimeout(() => setShowNotice(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleLayer = (layer: Layer) => {
    setLayers((prev) => {
      const next = new Set(prev);
      next.has(layer) ? next.delete(layer) : next.add(layer);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Cheer Mode Overlay */}
      {showCheer && (
        <CheerMode lang={lang} onClose={() => setShowCheer(false)} />
      )}

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
      <main className="flex-1 overflow-hidden relative">
        {tab === "map" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden relative">
              <LeafletMap activeLayers={layers} lang={lang} />
              
              {/* Floating UI on Map */}
              <StatusCard lang={lang} />
              <button 
                className="floating-notice-btn"
                onClick={() => setShowNotice(true)}
              >
                <Bell size={14} fill="white" />
                {lang === "ko" ? "실시간 교통상황" : "Live Traffic Info"}
              </button>
              
              <LivePip />
            </div>
            <InfoPanel onCheer={() => setShowCheer(true)} />
          </div>
        )}
        {tab === "chat"  && <GuestChat lang={lang} />}
        {tab === "board" && <FanBoard />}
      </main>

      {/* Modals */}
      {showNotice && (
        <NoticeModal lang={lang} onClose={() => setShowNotice(false)} />
      )}
    </div>
  );
}
