// app/view/[screenId]/page.tsx
'use client'; // 상태 관리와 이벤트를 위해 클라이언트 컴포넌트로 설정합니다.

import React, {  useState } from "react";
import axios from "@/api/axios";
import { useParams } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine from "@/components/DynamicEngine";
import Pagination from "@/components/Pagination";
import FilterToggle from "@/components/FilterToggle";
import {usePageMetadata} from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
import Skeleton from "@/components/Skeleton";

// @@@@ 2026-02-07 주석 추가 :
// CommonPage 역할 : 전체 화면의 구성, 메타데이터와 데이터를 가져와 엔진에 전달
export default function CommonPage() {
    const {screenId} = useParams() as{ screenId :  string}; // 타입 캐스팅으로 에러 방지

// 1. 상태 선언을 훅 호출보다 위로 올림 (중요!)
    const [currentPage, setCurrentPage] = useState(1);
    const [isOnlyMine, setIsOnlyMine] = useState(false);

    // 훅 호출
    // 2. 데이터 조회 관련 훅 호출
    const { metadata, pageData, loading, totalCount, isLoggedIn } = usePageMetadata(screenId, currentPage, isOnlyMine);

    // 3. 사용자 액션 관련 훅 호출 , formData를 꺼내온다
    const {formData, handleChange, handleAction, showPassword, pwType} = usePageActions(metadata);

    // @@@@ 2026-02-07 추가 서버 데이터(pageData)와 사용자 입력 데이터(formData)를 합친다. 사용자 입력값이 있을 경우 formData를 우선하고 없으면 초기값을 쓴다

    const combineData = {...pageData, ...formData};

    const handleToggleMine = () => {
        setIsOnlyMine(prev => !prev);
        setCurrentPage(1);
    };

    const filtedMetadata = metadata.map((item: any) => {
        if(item.componentId === "pw_toggle_btn"){
            return { ...item, labelText: showPassword ? "숨기기" : "보이기" };
        }
        return item;
    }).filter((item:any) => {
        if (item.componentId === "go_login_btn" || item.componentId === "go_tutorial_btn")
            return !isLoggedIn;
        if (item.componentId === "go_diary_btn" || item.componentId === "view_diary_list_btn")
            return isLoggedIn;
        return true;
    });

    // @@@@ 2026-02-04 스켈레톤 UI로 바꿈
    if (loading) {
        return <Skeleton />
    }

    return (
        <div className={`page-wrap ${screenId}`}>
            {screenId === "DIARY_LIST" && (
                <FilterToggle isOnlyMine={isOnlyMine} onToggle={handleToggleMine} />
            )}
            <DynamicEngine
                metadata={filtedMetadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={combineData}
                pwType={pwType}
                showPassword={showPassword}
            />

            {screenId === "DIARY_LIST"  && (
                <Pagination
                    totalCount={totalCount}
                    pageSize={5}
                    currentPage={currentPage}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        console.log(`[페이지 변경] 현재 페이지: ${currentPage}, 변경된 페이지: ${page}`);
                    }}
                />
            )}
        </div>
    );
}