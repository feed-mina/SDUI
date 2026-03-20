"use client";

// Phase 2: Guest AI chat — backend endpoint not yet implemented
export default function GuestChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
      <div style={{ fontSize: 48 }}>💜</div>
      <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 18 }}>
        AI 채팅 준비 중
      </p>
      <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
        외국인 팬과 소통 연습을 위한 AI 채팅이 곧 오픈됩니다.
      </p>
    </div>
  );
}
