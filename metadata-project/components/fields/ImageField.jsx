function ImageField({ meta }) {

    // 경로가 /img/ 안에 있다면 아래처럼 합쳐줍니다.
    const fileName = meta.label_text || meta.labelText || meta.label_text.split(".")[0];

    if(!meta.fileName || !fileName){
        const imagePath = fileName ? `/img/${fileName}` : "/img/default.png";
        const customStyle = JSON.parse(meta.inlineStyle || "{}");

        return (
            <div style={customStyle}>
                <img
                    src={imagePath ? imagePath : "/img/default.png"}
                    className={meta.cssClass}
                    alt="ui-element"
                    style={{ width: "100%" , height: "auto" }}
                    onError={(e) => { e.target.src = "/img/default.png"; }} // 에러 시 기본 이미지
                />
            </div>
        );
    }
}
export default ImageField;