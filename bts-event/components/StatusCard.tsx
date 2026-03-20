"use client";

import { CloudRain, Users, Thermometer, ExternalLink } from "lucide-react";
import { useState } from "react";

interface Props {
  lang: string;
}

export default function StatusCard({ lang }: Props) {
  const [showWeather, setShowWeather] = useState(false);
  
  // Static data for Gwanghwamun (BTS Event Day)
  const temp = 21;
  const congestion = lang === "ko" ? "매우 혼잡 🔥" : "Very Crowded 🔥";
  const rainChance = "5%";
  const weatherUrl = "https://m.kma.go.kr/m/main.jsp";

  return (
    <>
      <div 
        className="status-card cursor-pointer hover:bg-bg-dark transition-all border-l-4 border-bts-purple-light"
        onClick={() => setShowWeather(true)}
        title={lang === "ko" ? "기상청 실시간 정보 보기" : "View Live Weather Info"}
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
          <span className="text-purple-100">{congestion}</span>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
        </div>
        <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-1">
          <ExternalLink size={8} />
          {lang === "ko" ? "기상청 자동 연결" : "Source: KMA"}
        </div>
      </div>

      {/* Weather Info Modal */}
      {showWeather && (
        <div className="modal-overlay" onClick={() => setShowWeather(false)}>
          <div className="modal-content !max-w-[450px] !p-0 overflow-hidden flex flex-col h-[70vh]" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header !mb-0 p-4 border-b border-border bg-bg-card flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ⛅️ {lang === "ko" ? "실시간 날씨 (기상청)" : "Live Weather Info"}
              </h2>
              <button onClick={() => setShowWeather(false)} className="p-1 hover:bg-white/10 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors">✕</div>
              </button>
            </div>
            <div className="flex-1 bg-white relative">
              <iframe 
                src={weatherUrl}
                className="w-full h-full border-none"
                title="KMA Mobile Weather"
              />
              <div className="absolute inset-0 pointer-events-none bg-indigo-50/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 {/* Empty fallback hint if needed */}
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
                {lang === "ko" ? "기상청 새창열기" : "Open Original"}
              </a>
               <button 
                onClick={() => setShowWeather(false)}
                className="px-4 py-2 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-600"
              >
                {lang === "ko" ? "닫기" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
