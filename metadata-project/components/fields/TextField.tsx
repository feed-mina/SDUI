'use client';

import React from "react";

interface TextFieldProps {
    meta: {
        componentId: any;
        ref_data_id?: string;
        refDataId?: string;
        labelText?: string;
        cssClass?: string;
        inline_style?: string;
    };
    data?: any; // 현재는 any로 두지만, 나중에 일기 데이터 타입으로 구체화할 수 있습니다.
}

const TextField: React.FC<TextFieldProps> = ({ meta, data }) => {
    // console.log(`[${meta.componentId}] 배달된 상자의 열쇠들:`, data ? Object.keys(data) : "데이터 없음");
    // console.log(`[${meta.componentId}] 내가 가진 열쇠(refDataId):`, meta.ref_data_id);

    let customStyle: React.CSSProperties = {};
    try {
        customStyle = JSON.parse(meta.inline_style || "{}");
    } catch (e) {
        customStyle = {};
    }
    const key = meta.ref_data_id || meta.refDataId;
    // const displayValue = (meta.ref_data_id && data) ? data[meta.ref_data_id] : meta.labelText;
    let displayValue = (key && data) ? data[key] : meta.labelText;
    // if (key && data) {
        // 1. 소문자로 먼저 찾아보고 (예: title)
        // 2. 없으면 대문자로도 찾아봅니다 (예: TITLE)
        // displayValue = data[key] || data[key.toUpperCase()] || meta.labelText;}


    // console.log(`[${meta.componentId}] 최종 표시될 값:`, displayValue);


    // 20260120_날짜변환
   const formatDate = (dateString: string) => {
       if (!dateString) return "";

       // T를 기준으로 앞 부분(날짜)만 가져온다.
       const datePart = dateString.split('T')[0];
       // - 기호를 .으로 바꾼다
       return datePart.replace(/-/g, '.');
   }

   if (key === 'reg_dt' && displayValue){
       displayValue = formatDate(displayValue);
   }


    return (
        <div className={meta.cssClass} style={customStyle}>
            {displayValue}
        </div>
    );
};

export default TextField;