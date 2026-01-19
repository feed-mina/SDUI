// src/components/fields/InputField.js

function InputField({ id,pwType, showPassword, label, className, style, placeholder, readOnly, isRequired, onChange, onAction, metadata }) {
    // 1. label이 있을 때만 <label> 태그를 보여줍니다.
    // 2. id는 민아 님이 말씀하신 COMPONENT_ID가 들어오며, 이는 데이터 저장 키가 됩니다.
    // 3. className에는 DB에서 넘어온 CSS_CLASS 값이 적용됩니다.



    const handleInputChange = (e) => {
        onChange(e.target.id, e.target.value);
    }
    // 20260117 enter 하면 작동
    const onKeyDown = (e) =>{
        if (e.key === 'Enter'){
            // 부모로부터 받은 handleAction을 직접 호출한다
            // SUBMIT 타입에 버튼을 강제로 클릭하게 만든다.
            // 1. 메타데이터에서 SUBMIT액션을 가진 항목을 찾는다.
            const submitComponent = metadata.find(meta => meta.actionType === "SUBMIT");
            // 2. 찾은 항목의 actionUrl을 사용하여 공통액션 함수를 실행한다.
            if (submitComponent){
                onAction({
                    actionType: "SUBMIT",
                    actionUrl: submitComponent.actionUrl,
                    componentId: submitComponent.componentId
                });
            }
        }
    }
// JSON의 inlineStyle은 문자열이므로 객체로 변환해서 사용해야 할 수도 있습니다.
    // 여기서는 부모가 주는 style 객체를 그대로 사용한다고 가정합니다.
    const inputStyle = {
        ...style,
        width: id === 'user_email' ? '100%' : style?.width // 개별 필드의 너비 조절
    };return (
        <>
            {/* label이 필요한 경우만 출력, 없으면 바로 input 출력 */}
            {/*{label && <label htmlFor={id} style={{ display: 'block', marginBottom: '5px' }}>{label}</label>}*/}
            <input
                type={id.includes('pw') ? (pwType || 'password') : 'text'}
                id={id}
                name={id}
                placeholder={placeholder}
                readOnly={readOnly}
                required={isRequired}
                className={className}
                style={{...style, flex:1}} // input에만 스타일을 적용합니다.
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
            />
        </>
    );
}

export default InputField;