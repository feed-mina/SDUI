// app/view/[screenId]/page.tsx
'use client'; // 상태 관리와 이벤트를 위해 클라이언트 컴포넌트로 설정합니다.

import React, { use, useState, useMemo } from "react";
import axios from "@/api/axios";
import { useParams } from "next/navigation"; // Next.js 전용으로 변경
import DynamicEngine, {Metadata} from "@/components/DynamicEngine";
import Pagination from "@/components/Pagination";
import FilterToggle from "@/components/FilterToggle";
import {usePageMetadata} from "@/hooks/usePageMetadata";
import { usePageActions } from "@/hooks/usePageActions";
import Skeleton from "@/components/Skeleton";

// @@@@ 2026-02-07 주석 추가 :
// CommonPage 역할 : 전체 화면의 구성, 메타데이터와 데이터를 가져와 엔진에 전달
export default function CommonPage({ params: paramsPromise }: { params: Promise<{ screenId: string }> }) {

    // Next.js 15에서는 params를 unwrapping 해야 합니다.
    const params = use(paramsPromise);
    const screenId = params.screenId;
    // const {screenId} = useParams() as{ screenId :  string}; // 타입 캐스팅으로 에러 방지

// 1. 상태 선언을 훅 호출보다 위로 올림 (중요!)
    const [currentPage, setCurrentPage] = useState(1);
    const [isOnlyMine, setIsOnlyMine] = useState(false);

    // 훅 호출
    // 2. 데이터 조회 관련 훅 호출
    const { metadata, pageData, loading, totalCount, isLoggedIn } = usePageMetadata(screenId, currentPage, isOnlyMine);

    // 3. 사용자 액션 관련 훅 호출 , formData를 꺼내온다
    const {formData, handleChange, handleAction, showPassword, pwType} = usePageActions(metadata);

    // @@@@ 2026-02-07 추가 서버 데이터(pageData)와 사용자 입력 데이터(formData)를 합친다. 사용자 입력값이 있을 경우 formData를 우선하고 없으면 초기값을 쓴다

    const combineData = useMemo(() => ({
        ...pageData,
        ...formData
    }), [pageData, formData]);

    const handleToggleMine = () => {
        setIsOnlyMine(prev => !prev);
        setCurrentPage(1);
    };

    // @@@@ 2026-02-08 추가 api 변경에 따라 트리구조에 따라 children 재귀적으로 랜더링
    const filtedMetadata = useMemo(() => {
        // 트리 구조를 깊숙이 탐색하며 필터링 하는 함수
        const filterRecursive = (items: any[]): any[] => {
            return items
                .map(item => ({
                    ...item,
                    //     자식이 있으면 자식들도 다시 이 함수(자신)을 태워서 필터링함
                    children: item.children ? filterRecursive(item.children) : null,
                    // 비밀번호 토글 텍스트 변경 로직도 여기서 처리하면 깔끔해
                    labelText: item.componentId === "pw_toggle_btn" ? (showPassword ? "숨기기" : "보이기")
                        : item.labelText
                }))
                .filter(item => {
                    // 로그인 여부에 따른 버튼 노출 로직
                    if (item.componentId === "go_login_btn" || item.componentId === "go_tutorial_btn") {
                        return !isLoggedIn; // 로그인 안했을때 보임
                    }
                    if (item.componentId === "go_diary_btn" || item.componentId === "view_diary_list_btn") {
                        return isLoggedIn;
                    }
                    return true; // 그 외 컴포넌트 (그룹, 이미지 등)은 유지
                });
        };
        return filterRecursive(metadata);
    }, [metadata, showPassword, isLoggedIn]);


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