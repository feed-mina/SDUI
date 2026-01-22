'use client';

import React , {useState} from 'react';

// 타입을 정의한다
interface PasswordFieldProps {
    meta:{
        id: string;
        componentId: string;
        labelText?: string;
        cssClass?: string;
        inline_style?: string;
        componentType?: string;
    };
    onChange?:(id: string, value: string) => void;
}

const PasswordField: React.FC<any> = ({meta, onChange, onAction}) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // 인라인스타일처리
    let customStyle= {};
    try{
        customStyle = JSON.parse(meta.inline_style || "{}");
    } catch (e){
        customStyle = {};
    }

    return (
        <div className={meta.cssClass} style={{position: 'relative', width: '100%'}}>
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder={meta.labelText|| "비밀번호를 입력하세요"}
                className={meta.cssClass}
                style={{...customStyle, width: '100%', paddingRight: '70px',boxSizing: 'border-box'}}
                onChange={(e)=>onChange && onChange(meta.componentId || 'password', e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && onAction) onAction(meta);
                }}
                    />
            <button type="button"
                    onClick={() => {
                        console.log('showPassword : ', showPassword);
                        setShowPassword(!showPassword)
                    }}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        background: 'none',
                        border: 'none',
                        fontSize: '30px',
                        fontWeight: 'bold',
                        zIndex: 2,
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        filter: 'grayscale(100%)',
                    }}>
                {showPassword ? '👀' : '🕶️'}
            </button>
        </div>
    );
};

export default PasswordField;