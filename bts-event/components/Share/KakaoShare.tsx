"use client";

declare global {
  interface Window {
    Kakao: any;
  }
}

export default function KakaoShare() {
  const share = () => {
    if (!window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
    }
    if (!window.Kakao.Share) return;

    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "💜 BTS 광화문 현장 지도",
        description: "24시간 카페 · 충전 · 구급 텐트 · 지하철 탈출 루트",
        imageUrl: "https://bts-gwanghwamun.vercel.app/og-image.png",
        link: {
          mobileWebUrl: "https://bts-gwanghwamun.vercel.app",
          webUrl: "https://bts-gwanghwamun.vercel.app",
        },
      },
      buttons: [
        {
          title: "지도 열기",
          link: {
            mobileWebUrl: "https://bts-gwanghwamun.vercel.app",
            webUrl: "https://bts-gwanghwamun.vercel.app",
          },
        },
      ],
    });
  };

  return (
    <button className="info-btn kakao" onClick={share}>
      💬 카카오톡 공유
    </button>
  );
}
