// src/app/page.tsx

export default function Home() {
  return (
      <main style={{ padding: '20px' }}>
        <h1>동적 메타데이터 프로젝트 시작</h1>
        <p>현재 Next.js 환경에서 화면이 정상적으로 출력되고 있습니다.</p>
        <hr />
        {/* 여기에 나중에 기존 리액트에서 만든 엔진 컴포넌트를 가져올 거예요 */}
        <section>
          <h2>UI 엔진 영역</h2>
          <p>기존 리액트 코드를 이사 올 준비가 되었습니다.</p>
        </section>
      </main>
  )
}