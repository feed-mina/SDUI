import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? 'http://43.201.237.68:8081'
  : 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    // 요청 바디 읽기
    const body = await request.json();

    // 쿠키 헤더 가져오기
    const cookieHeader = request.headers.get('cookie');

    // 백엔드로 프록시 요청
    const response = await fetch(`${BACKEND_URL}/api/auth/update-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader || '',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    // 백엔드 응답 읽기
    const data = await response.json();

    // Set-Cookie 헤더를 클라이언트로 전달
    const setCookieHeaders = response.headers.get('set-cookie');
    const nextResponse = NextResponse.json(data, { status: response.status });

    if (setCookieHeaders) {
      nextResponse.headers.set('set-cookie', setCookieHeaders);
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
