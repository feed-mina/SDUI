'use client';
import React from "react";
import { useParams, useRouter } from "next/navigation";
import DynamicEngine from "@/components/DynamicEngine";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";

export default function DiaryDetailPage() {
    const params = useParams();
    const diaryId = params.id as string;
    const screenId = "DIARY_DETAIL";

    // 인자 4개 전달 (위에서 훅을 수정했으므로 에러 사라짐)
    const { metadata, pageData, loading } = usePageMetadata(screenId, 1, false, diaryId);

    // 여기서 pwType, showPassword도 같이 꺼냅니다.
    const { handleChange, handleAction, pwType, showPassword } = usePageActions(metadata);

    if (loading) return <div>로딩중...</div>;

    return (
        <div className="page-wrap diary-detail">
            <DynamicEngine
                metadata={metadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData}
                // [추가] 빠진 props 전달
                pwType={pwType}
                showPassword={showPassword}
            />
        </div>
    );
}