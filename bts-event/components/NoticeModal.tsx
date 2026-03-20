"use client";

import { X, ExternalLink, RefreshCcw } from "lucide-react";
import { useState } from "react";

interface Props {
  onClose: () => void;
  lang: string;
}

export default function NoticeModal({ onClose, lang }: Props) {
  const [key, setKey] = useState(0); // For iframe refresh
  const topisUrl = "https://m.topis.seoul.go.kr/";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !max-w-[450px] !p-0 overflow-hidden flex flex-col h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header !mb-0 p-4 border-b border-border bg-bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🚨 {lang === "ko" ? "실시간 교통 상황 (TOPIS)" : "Live Traffic Info"}
            </h2>
            <button 
              onClick={() => setKey(prev => prev + 1)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="새로고침"
            >
              <RefreshCcw size={16} className="text-gray-400" />
            </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        {/* Iframe Area */}
        <div className="flex-1 bg-white relative">
          <iframe 
            key={key}
            src={topisUrl}
            className="w-full h-full border-none"
            title="Seoul TOPIS Mobile"
          />
          
          {/* Overlay to catch initial block if needed */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-black/80 backdrop-blur p-4 rounded-xl pointer-events-auto border border-white/20 shadow-2xl">
              <p className="text-xs text-white/70 mb-2 leading-relaxed">
                {lang === "ko" 
                  ? "⚠️ 공식 사이트 규정상 화면이 보이지 않을 수 있습니다. 이 경우 아래 버튼을 사용해 주세요." 
                  : "⚠️ If the window is blank, it's due to security policies. Please use the button below."}
              </p>
              <a 
                href={topisUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink size={14} />
                {lang === "ko" ? "공식 사이트 새창열기" : "Open in New Tab"}
              </a>
            </div>
          </div>
        </div>
        
        {/* Simple Footer */}
        <div className="p-3 bg-bg-card border-t border-border flex justify-end shrink-0">
           <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-600"
          >
            {lang === "ko" ? "닫기" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
