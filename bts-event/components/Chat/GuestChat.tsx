import { useState, useRef, useEffect } from "react";
import { type Lang } from "@/components/LangToggle";
import { getGuestChatCount, incrementGuestChatCount, hasGuestChatRemaining } from "@/lib/guestLimit";
import { guestChat } from "@/lib/api";

const SDUI_URLS = {
  en: "https://sdui-delta.vercel.app/view/AI_ENGLISH_CHAT_PAGE",
  ja: "https://sdui-delta.vercel.app/view/AI_JAPANESE_CHAT_PAGE",
  ko: "https://sdui-delta.vercel.app/view/AI_KOREAN_CHAT_PAGE",
};

export default function GuestChat({ lang }: { lang: Lang }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const scrollRef = useRef<HTMLDivElement>(null);

  const canChat = hasGuestChatRemaining();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!canChat && lang !== "ko") {
      if (confirm("게스트 채팅 5회 제한을 초과했습니다. 로그인하고 계속하시겠습니까?")) {
        window.location.href = SDUI_URLS[lang] || SDUI_URLS.en;
      }
      return;
    }

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const reply = await guestChat(userText, lang, sessionId);
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
      incrementGuestChatCount();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "ai", text: "오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!canChat && messages.length === 0 && lang !== "ko") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50/50">
        <div className="text-6xl mb-4">📢</div>
        <h2 className="text-xl font-bold mb-2">무료 채팅 횟수 소진</h2>
        <p className="text-gray-600 mb-6">
          게스트용 AI 채팅 5회를 모두 사용하셨습니다.<br/>
          로그인하시면 더 고도화된 AI 소통 서비스를 이용하실 수 있습니다.
        </p>
        <a 
          href={SDUI_URLS[lang] || SDUI_URLS.en}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          로그인하고 계속하기 💜
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]/5">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm inline-block max-w-sm">
              <p className="text-lg font-bold text-indigo-900 mb-2">
                {lang === "ko" ? "반가워요! 💜" : lang === "ja" ? "はじめまして! 💜" : "Hello! 💜"}
              </p>
              <p className="text-sm text-gray-600">
                {lang === "ko" 
                  ? "방탄소년단 광화문 현장 안내 AI입니다. 궁금한 점을 물어보세요!" 
                  : "I'm here to help you at the BTS Gwanghwamun site. Ask me anything!"}
              </p>
              <div className="mt-4 text-[10px] text-gray-400">
                게스트 채팅 5회 제한이 적용됩니다 (잔여: {getGuestChatCount()}/5)
              </div>
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
              m.role === "user" 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-white text-gray-800 rounded-tl-none border border-indigo-100"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-indigo-100 animate-pulse text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-indigo-100">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder={canChat ? "메시지를 입력하세요..." : "채팅 한도가 초과되었습니다."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!canChat && lang !== "ko"}
          />
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              canChat ? "bg-indigo-600 text-white hover:scale-105" : "bg-gray-300 text-gray-500"
            }`}
            onClick={handleSend}
            disabled={loading || (!canChat && lang !== "ko")}
          >
            ✈️
          </button>
        </div>
      </div>
    </div>
  );
}
