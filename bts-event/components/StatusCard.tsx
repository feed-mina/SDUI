"use client";

import { CloudRain, Users, Thermometer, ExternalLink } from "lucide-react";
import { useState } from "react";

interface Props {
  lang: string;
}

export default function StatusCard({ lang }: Props) {
  const [showWeather, setShowWeather] = useState(false);
  
  const translations = {
    ko: { 
      congestion: "혼잡 (여유로움) 💜", 
      weatherTitle: "실시간 날씨 (기상청)", 
      viewWeather: "기상청 실시간 정보 보기",
      source: "기상청 실시간 상세정보",
      fallback: "⚠️ 화면이 보이지 않으면 아래 버튼을 클릭하여 공식 사이트로 이동해 주세요.",
      openNew: "기상청 새창열기",
      close: "닫기"
    },
    en: { 
      congestion: "Moderate 💜", 
      weatherTitle: "Live Weather", 
      viewWeather: "View Live Weather Info",
      source: "Source: Weather.go.kr",
      fallback: "⚠️ If blank, click the button below to view official weather site.",
      openNew: "Open Original",
      close: "Close"
    },
    ja: { 
      congestion: "混雑 (余裕) 💜", 
      weatherTitle: "ライブ天気", 
      viewWeather: "気象庁の情報を表示",
      source: "詳細: 気象庁", 
      fallback: "⚠️ 表示されない場合は、下のボタンから公式サイトを開いてください。",
      openNew: "公式サイトを開く",
      close: "閉じる"
    }
  };

  const text = (translations as any)[lang] || translations.ko;

  const temp = 18;
  const rainChance = "0%";
  const weatherUrl = "https://www.weather.go.kr/w/m/index.do";

  return (
    <>
      <div 
        className="status-card cursor-pointer hover:scale-105 active:scale-95 transition-all border-l-4 border-bts-purple-light"
        onClick={() => setShowWeather(true)}
        title={text.viewWeather}
      >
        <div className="status-item text-white">
          <Thermometer size={14} className="text-orange-400" />
          {temp}°C
          <span className="opacity-50 mx-1">|</span>
          <CloudRain size={14} className="text-blue-300" />
          {rainChance}
        </div>
        <div className="status-item mt-1">
          <Users size={14} className="text-purple-400" />
          <span className="text-purple-100">{text.congestion}</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
        </div>
        <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
          <ExternalLink size={8} />
          {text.source}
        </div>
      </div>

      {showWeather && (
        <div className="modal-overlay" onClick={() => setShowWeather(false)}>
          <div className="modal-content !max-w-[500px] !p-0 overflow-hidden flex flex-col h-[75vh]" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header !mb-0 p-4 border-b border-border bg-bg-card flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ⛅️ {text.weatherTitle}
              </h2>
              <button onClick={() => setShowWeather(false)} className="p-1 hover:bg-white/10 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</div>
              </button>
            </div>
            <div className="flex-1 bg-white relative">
              <iframe 
                src={weatherUrl}
                className="w-full h-full border-none"
                title="Official Weather Info"
              />
              <div className="absolute inset-x-0 bottom-4 px-6 pointer-events-none">
                 <div className="bg-black/70 backdrop-blur rounded-lg p-3 text-center border border-white/20 pointer-events-auto">
                   <p className="text-[10px] text-white/80 mb-2">
                     {text.fallback}
                   </p>
                 </div>
              </div>
            </div>
            <div className="p-3 bg-bg-card border-t border-border flex justify-between items-center shrink-0">
               <a 
                href={weatherUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
              >
                <ExternalLink size={12} />
                {text.openNew}
              </a>
               <button 
                onClick={() => setShowWeather(false)}
                className="px-4 py-2 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600"
              >
                {text.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
