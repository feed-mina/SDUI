import { translations } from "@/data/translations";
import { type Lang } from "../LangToggle";

export type Layer = "cafe" | "charging" | "emergency" | "subway";

interface Props {
  active: Layer | null;
  onSelect: (layer: Layer) => void;
  lang: Lang;
}

export default function LayerFilter({ active, onSelect, lang }: Props) {
  const t = translations[lang].layers;

  const LAYERS: { key: Layer; label: string; emoji: string }[] = [
    { key: "cafe",      label: t.cafe,      emoji: "☕" },
    { key: "charging",  label: t.charging,  emoji: "🔋" },
    { key: "emergency", label: t.emergency, emoji: "🏥" },
    { key: "subway",    label: t.subway,    emoji: "🚇" },
  ];

  return (
    <div className="layer-bar">
      {LAYERS.map(({ key, label, emoji }) => (
        <button
          key={key}
          className={`layer-btn ${active === key ? "active" : ""}`}
          onClick={() => onSelect(key)}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}
