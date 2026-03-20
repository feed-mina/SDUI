"use client";

import KakaoShare from "./Share/KakaoShare";
import LineShare from "./Share/LineShare";

const PAGE_URL  = "https://bts-gwanghwamun.vercel.app";
const TWEET_TEXT = "💜 BTS 광화문 현장 지도 — 24h 카페·충전·구급·지하철 루트";

const KAKAOPAY_URL   = process.env.NEXT_PUBLIC_KAKAOPAY_URL;

async function shareLocation() {
  if (!navigator.geolocation) {
    alert("위치 공유가 지원되지 않는 브라우저입니다.");
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const text = `📍 내 위치: https://map.kakao.com/?q=${latitude},${longitude}`;
    if (navigator.share) {
      navigator.share({ title: "내 위치", text });
    } else {
      navigator.clipboard.writeText(text);
      alert("위치 링크가 복사되었습니다.");
    }
  });
}

function copyLink() {
  navigator.clipboard.writeText(PAGE_URL);
  alert("링크가 복사되었습니다! 💜");
}

import { Heart } from "lucide-react";

interface Props {
  onCheer?: () => void;
}

export default function InfoPanel({ onCheer }: Props) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(TWEET_TEXT)}&url=${encodeURIComponent(PAGE_URL)}`;

  return (
    <div className="info-panel">
      {/* CCTV / Traffic */}
      <a
        href="https://cctv.seoul.go.kr"
        target="_blank"
        rel="noopener noreferrer"
        className="info-btn"
      >
        📹 CCTV
      </a>
      <a
        href="http://topis.seoul.go.kr"
        target="_blank"
        rel="noopener noreferrer"
        className="info-btn"
      >
        🗺️ TOPIS
      </a>
      
      {/* Cheer Mode */}
      <button 
        className="info-btn support" 
        onClick={onCheer}
        title="응원봉 모드 활성화"
      >
        <Heart size={14} fill="currentColor" />
        치어 모드
      </button>

      {/* Share */}
      <KakaoShare />
      <LineShare />
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="info-btn"
      >
        𝕏 X 공유
      </a>
      <button className="info-btn" onClick={copyLink}>
        📋 링크 복사
      </button>
      <button className="info-btn" onClick={shareLocation}>
        📍 내 위치
      </button>

      {/* Community / Support */}
      {KAKAOPAY_URL && (
        <a
          href={KAKAOPAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="info-btn support"
        >
          ☕ 후원 💜
        </a>
      )}
    </div>
  );
}
