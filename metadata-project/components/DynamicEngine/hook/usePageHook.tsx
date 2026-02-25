// usePageHook.ts
import { useUserActions } from "./useUserActions";
import { useBusinessActions } from "./useBusinessActions";

export const usePageHook = (screenId: string, metadata: any[], initialData: any) => {
// screenId가 REGISTER_PAGE면 유저 액션 훅을 반환
    const isUserDomain = screenId === "REGISTER_PAGE" || screenId.includes("LOGIN");
    const userActions = useUserActions(metadata, initialData);
    const businessActions = useBusinessActions(metadata, initialData);
    // 결정된 훅 세트를 반환
    return isUserDomain ? userActions : businessActions;
};