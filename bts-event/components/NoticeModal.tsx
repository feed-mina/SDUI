"use client";

import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface AlertItem {
  id: number;
  title_ko: string;
  title_en: string;
  desc_ko: string;
  desc_en: string;
  type: "CRITICAL" | "WARNING";
  time?: string;
}

interface Props {
  onClose: () => void;
  lang: string;
}

export default function NoticeModal({ onClose, lang }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then(res => res.json())
      .then(data => {
        setAlerts(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🚨 {lang === "ko" ? "실시간 행사 공지" : "Live Event Notice"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>{lang === "ko" ? "정보를 불러오는 중..." : "Fetching latest info..."}</p>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 ${
                alert.type === "CRITICAL" ? "bg-red-500/10 border-red-500" : "bg-yellow-500/10 border-yellow-500"
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-bold ${
                    alert.type === "CRITICAL" ? "text-red-400" : "text-yellow-400"
                  }`}>
                    {lang === "ko" ? alert.title_ko : alert.title_en}
                  </h3>
                  {alert.time && <span className="text-[10px] text-gray-500">{alert.time}</span>}
                </div>
                <p className="text-sm text-gray-300">
                  {lang === "ko" ? alert.desc_ko : alert.desc_en}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              {lang === "ko" ? "등록된 공지사항이 없습니다." : "No current notices."}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200"
          >
            {lang === "ko" ? "닫기" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
