// @/components/AppShell.tsx
'use client';
import { useMetadata } from "@/components/MetadataProvider";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import RecordTimeComponent from "@/components/fields/RecordTimeComponent";

/**
 * AppShell 역할: 디바이스 환경에 따라 최적화된 레이아웃 구조를 렌더링, 레이아웃 중재자, RootLayout 내부에서 MetadataProvider의 데이터를 구독해 전체 뼈대를 결정한다 .
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
    const { isDesktop, isLoading } = useMetadata();

    if (isLoading) return <div className="loading-screen">설계도를 불러오는 중...</div>;

    return (
        <div className={`app-wrapper ${isDesktop ? 'is-pc' : 'is-mobile'}`}>
            {/* [핵심 1] 디바이스에 따른 네비게이션 교체 */}
            {isDesktop ? <Sidebar /> : <Header />}

            <main className="main-contents-area">
                {/* [핵심 2] PC 전용 상단 유틸리티 영역 (기록 컴포넌트 배치) */}
                {isDesktop && (
                    <div className="pc-top-utility">
                        <RecordTimeComponent />
                    </div>
                )}

                <section className="page-view-container">
                    {children}
                </section>
            </main>
        </div>
    );
}