'use client';
import React from 'react';

const ImageField = ({ meta, pageData }: any) => {
    // 경로가 /img/ 안에 있다면 아래처럼 합쳐줍니다.
    const fileName = meta.label_text || meta.labelText || meta.label_text.split(".")[0];

    const imagePath = fileName ? `/img/${fileName}` : "/img/default.png";
    const customStyle = JSON.parse(meta.inlineStyle || "{}");

    return (
        <div style={customStyle}>
            <img
                src={imagePath ? imagePath : "/img/default.png"}
                className={meta.cssClass}
                alt="ui-element"
                style={{width: "100%", height: "auto"}}
            />
        </div>
    );
}

export default ImageField;