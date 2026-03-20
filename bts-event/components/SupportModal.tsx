"use client";

import { Coffee, Heart, ExternalLink } from "lucide-react";
import { type Lang } from "./LangToggle";

interface SupportModalProps {
  lang: Lang;
  onClose: () => void;
}

const trans = {
  ko: {
    title: "개발자 응원하기 ☕",
    desc: "더 나은 서비스를 위해 고생하는 개발자에게 커피 한 잔 선물해 주세요! 여러분의 작은 응원이 큰 힘이 됩니다. 💜",
    button: "카카오페이로 후원하기",
    close: "나중에 하기"
  },
  en: {
    title: "Support Developer ☕",
    desc: "Buy the local developer a coffee! Your small support means a lot to us. 💜",
    button: "Support via KakaoPay",
    close: "Maybe later"
  },
  ja: {
    title: "開発者を応援する ☕",
    desc: "より良いサービスのために頑張る開発者にコーヒーを一杯プレゼントしてください！皆様の応援が大きな力になります。 💜",
    button: "KakaoPayで応援する",
    close: "後で"
  }
};

export default function SupportModal({ lang, onClose }: SupportModalProps) {
  const t = trans[lang] || trans.ko;
  // Use specific KakaoPay URL for the user's project
  const payUrl = "";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6 text-pink-500 shadow-inner">
            <Coffee size={40} />
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-4">{t.title}</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4 whitespace-pre-wrap">
            {t.desc}
          </p>

          <div className="flex flex-col w-full gap-3">
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#FEE500] text-[#3c1e1e] font-bold rounded-2xl hover:bg-[#F7D600] active:scale-95 transition-all shadow-md"
            >
              <Heart size={18} fill="#3c1e1e" />
              {t.button}
              <ExternalLink size={14} />
            </a>
            <button
              onClick={onClose}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Footer Accent with BTS gradient colors */}
        <div className="h-2 w-full bg-gradient-to-r from-[#7B61FF] via-[#FF61D2] to-[#61D2FF]" />
      </div>
    </div>
  );
}
