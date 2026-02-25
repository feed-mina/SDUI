'use client';

import { useState, useCallback, useRef, useEffect } from "react";

// screenId를 인자에 추가해서 어떤 페이지인지 알 수 있게 해 [cite: 2026-02-17]
export const useBaseActions = (screenId: string, metadata: any[] = [], initialData: any = {}) => {
    const [formData, setFormData] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [pwType, setPwType] = useState("password");

    const [prevMetadata, setPrevMetadata] = useState(metadata);
    const [prevInitialData, setPrevInitialData] = useState(initialData);

    // 1. Metadata가 바뀌면 (화면 이동 시) 폼 데이터 초기화 [cite: 2026-02-17]
    if (metadata !== prevMetadata) {
        setPrevMetadata(metadata);
        setFormData({});
    }

    // 2. InitialData가 들어오면 (데이터 로드 성공 시) 폼 데이터 채우기 [cite: 2026-02-17]
    if (initialData !== prevInitialData && Object.keys(initialData).length > 0) {
        setPrevInitialData(initialData);
        setFormData((prev: any) => ({
            ...initialData,
            ...prev
        }));
    }

    // [효율성 개선] 특정 페이지에서만 URL 쿼리 파라미터를 뒤져보도록 제한해 [cite: 2026-02-17]
    useEffect(() => {
        const targetScreens = ['VERIFY_CODE_PAGE', 'REGISTER_PAGE'];

        if (typeof window !== "undefined" && targetScreens.includes(screenId)) {
            const params = new URLSearchParams(window.location.search);
            const emailFromUrl = params.get("email");

            if (emailFromUrl) {
                setFormData((prev: any) => ({
                    ...prev,
                    reg_email: emailFromUrl, // 메타데이터 component_id 대응 [cite: 2026-02-17]
                    email: emailFromUrl      // ref_data_id 대응 [cite: 2026-02-17]
                }));
            }
        }
    }, [screenId]); // metadata 대신 screenId가 바뀔 때만 실행되어 효율적이야 [cite: 2026-02-17]

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const handleChange = useCallback((id: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    }, []);

    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
        setPwType(prev => prev === "password" ? "text" : "password");
    }, []);

    const flattenMetadata = useCallback((items: any[]): any[] => {
        const flatten = (data: any[]): any[] => {
            let result: any[] = [];
            data.forEach(item => {
                result.push(item);
                if (item.children && item.children.length > 0) {
                    result = result.concat(flatten(item.children));
                }
            });
            return result;
        };
        return flatten(items);
    }, []);

    return {
        formData,
        setFormData,
        formDataRef,
        handleChange,
        flattenMetadata,
        showPassword,
        pwType,
        togglePassword
    };
};