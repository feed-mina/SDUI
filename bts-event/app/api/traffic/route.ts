import { NextResponse } from "next/server";

export interface TrafficItem {
  accId: number;
  accTypeNm: string;
  accInfo: string;
  roadNm: string;
  linkNm: string;
  accRoadYn: string;
  occrDt: string;
  clrDt: string;
}

export async function GET() {
  try {
    const res = await fetch("https://topis.seoul.go.kr/map/selectAccList.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://topis.seoul.go.kr/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
      },
      // No body needed — endpoint returns all current incidents by default
    });

    if (!res.ok) {
      throw new Error(`TOPIS responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const rows: TrafficItem[] = data.rows ?? [];

    return NextResponse.json(
      { rows, fetchedAt: new Date().toISOString() },
      {
        headers: {
          // Allow client to cache for 2 minutes
          "Cache-Control": "public, max-age=120, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[/api/traffic] TOPIS fetch failed:", err);
    // Return empty so the UI can fall back gracefully
    return NextResponse.json(
      { rows: [], fetchedAt: null, error: true },
      { status: 200 }
    );
  }
}
