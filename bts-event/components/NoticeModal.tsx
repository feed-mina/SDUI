"use client";

import { X, ExternalLink, RefreshCcw } from "lucide-react";
import { useState } from "react";

interface Props {
  onClose: () => void;
  lang: string;
  title?: string;
}

export default function NoticeModal({ onClose, lang, title }: Props) {
  const [key, setKey] = useState(0); // For iframe refresh
  const topisUrl = "https://m.topis.seoul.go.kr/";

  const labels = {
    ko: { close: "닫기", refresh: "새로고침", fallback: "⚠️ 공식 사이트 규정상 화면이 보이지 않을 수 있습니다. 이 경우 아래 버튼을 사용해 주세요.", openNew: "공식 사이트 새창열기" },
    en: { close: "Close", refresh: "Refresh", fallback: "⚠️ Due to security policies, it may be blank. Please use the button below.", openNew: "Open in New Tab" },
    ja: { close: "閉じる", refresh: "更新", fallback: "⚠️ セキュリティポリシーにより表示されない場合があります。下のボタンをご利用ください。", openNew: "公式サイトを新しいタブで開く" }
  };

  const l = labels[lang as keyof typeof labels] || labels.ko;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content !max-w-[500px] !p-0 overflow-hidden flex flex-col h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header !mb-0 p-4 border-b border-border bg-bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🚨 {title || (lang === "ko" ? "실시간 교통 상황" : "Live Traffic Info")}
            </h2>
            <button 
              onClick={() => setKey(prev => prev + 1)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title={l.refresh}
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
          
          <div className="absolute inset-x-0 bottom-4 px-6 pointer-events-none">
            <div className="bg-black/80 backdrop-blur p-4 rounded-xl pointer-events-auto border border-white/20 shadow-2xl text-center">
              <p className="text-[11px] text-white/70 mb-3 leading-relaxed">
                {l.fallback}
              </p>
              <a 
                href={topisUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all"
              >
                <ExternalLink size={14} />
                {l.openNew}
              </a>
            </div>
          </div>
        </div>
        
        {/* Simple Footer */}
        <div className="p-3 bg-bg-card border-t border-border flex justify-end shrink-0">
           <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-600 transition-colors"
          >
            {l.close}
          </button>
        </div>
      </div>
    </div>
  );
}
