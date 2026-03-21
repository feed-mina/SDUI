import { translations } from "@/data/translations";
import { type Lang } from "./LangToggle";
import { Bell, Info, AlertTriangle, ExternalLink } from "lucide-react";

interface Props {
  lang: Lang;
  onClose: () => void;
  title: string;
}

export default function NoticeModal({ lang, onClose, title }: Props) {
  const t = (translations as any)[lang] || translations.ko;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content bg-[#1a1a2e] border-2 border-red-500/50 p-0 overflow-hidden max-w-md w-[90%] shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-red-600 p-4 flex items-center justify-between">
           <h2 className="text-white font-bold flex items-center gap-2">
             <AlertTriangle size={18} /> {lang === 'ko' ? '📢 긴급 교통 통제 공지' : 'Emergency Notice'}
           </h2>
           <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
             <p className="text-red-400 font-bold text-lg mb-2">
               🚨 {lang === 'ko' ? '광화문역 무정차 통과 안내' : 'Gwanghwamun Stn Non-stop'}
             </p>
             <div className="space-y-2 text-sm text-gray-200">
                <p>• ⏱️ **{lang === 'ko' ? '시간: 14:00 ~ 22:00' : 'Time: 14:00 - 22:00'}**</p>
                <p>• 🚫 **{lang === 'ko' ? '내용: 5호선 광화문역 열차 무정차 통과 및 전체 출입구 폐쇄' : 'Details: Line 5 Gwanghwamun Stn Closed & Non-stop'}**</p>
             </div>
          </div>

          <div className="space-y-3">
             <h3 className="font-bold text-white flex items-center gap-2 text-sm italic">
               <Info size={14} className="text-bts-purple-light" /> {lang === 'ko' ? '대체 이용 가능한 역 (도보 이동)' : 'Alternative Stations'}
             </h3>
             <div className="grid grid-cols-1 gap-2">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                   <span className="text-xs text-white">1호선 **종각역** (0.5km)</span>
                   <span className="text-[10px] text-gray-500">도보 8분</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                   <span className="text-xs text-white">3호선 **경복궁역** (0.6km)</span>
                   <span className="text-[10px] text-gray-500">도보 10분</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center">
                   <span className="text-xs text-white">2호선 **을지로입구역** (0.8km)</span>
                   <span className="text-[10px] text-gray-500">도보 12분</span>
                </div>
             </div>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
             ※ 공연 종료 후(22:00~)에는 열차가 정상 운행되며 귀가 인파를 위해 임시 열차가 증편될 예정입니다.
          </p>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-center">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-bts-purple text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
