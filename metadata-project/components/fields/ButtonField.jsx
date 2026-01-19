function ButtonField({ meta, onAction }) {
    return (
        <button
            className={meta.cssClass}
            style={JSON.parse(meta.inlineStyle || "{}")}
            onClick={() => onAction(meta)}
        >
            {meta.labelText}
        </button>
    );
}

export default ButtonField;