// @@@@ 2026-02-07 Metadata 인인터페이스 타입 정의

export interface Metadata {
    componentId: string;
    component_id: string;
    componentType: string;
    component_type?: string;
    parentGroupId?: string | null;
    parent_group_id?: string | null;
    groupId?: string | null;
    group_id?: string | null; // 추가
    refDataId?: string;
    ref_data_id?: string; //
    isVisible?: boolean | string;
    is_visible?: boolean | string;
    groupDirection?: "ROW" | "COLUMN";
    cssClass?: string;
    css_class?: string;
    inlineStyle?: any;
    actionType?: string;
    placeholder?: string;
    uiId?: string;
    labelText?: string;
    isReadonly?: boolean | string;
    children?: Metadata[] | null;
}

export interface DynamicEngineProps {
    metadata: Metadata[];
    formData: any;
    pageData: any;
    onChange: (id: string, value: any) => void;
    onAction: (meta: Metadata, data?: any) => void;
    pwType?: string;
    showPassword?: boolean;
}