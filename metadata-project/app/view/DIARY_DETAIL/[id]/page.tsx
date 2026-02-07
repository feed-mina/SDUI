'use client';
import React from "react";
import { useParams, useRouter } from "next/navigation";
import DynamicEngine from "@/components/DynamicEngine";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
import Skeleton from "@/components/Skeleton";

export default function DiaryDetailPage() {
    const params = useParams();
    const diaryId = params.id as string;
    const screenId = "DIARY_DETAIL";

    // 인자 4개 전달 (위에서 훅을 수정했으므로 에러 사라짐)
    const { metadata, pageData, loading } = usePageMetadata(screenId, 1, false, diaryId);
    console.log("metadata_page:", metadata);
    console.log("pageData:", pageData);

    // 여기서 pwType, showPassword도 같이 꺼냅니다.
    const { handleChange, handleAction, pwType, showPassword } = usePageActions(metadata);

    if (loading) return <Skeleton />;

    console.log("diaryIdpage_pageData:", pageData);
    console.log("diaryIdpage_metadata:", metadata);

    return (
        <div className="page-wrap diary-detail">
            <DynamicEngine
                metadata={metadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData}
                pwType={pwType}
                showPassword={showPassword}
            />
        </div>
    );
}