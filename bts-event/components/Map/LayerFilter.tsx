"use client";

export type Layer = "cafe" | "charging" | "emergency" | "subway";

const LAYERS: { key: Layer; label: string; emoji: string }[] = [
  { key: "cafe",      label: "24h 카페",  emoji: "☕" },
  { key: "charging",  label: "충전",      emoji: "🔋" },
  { key: "emergency", label: "구급",      emoji: "🏥" },
  { key: "subway",    label: "지하철",    emoji: "🚇" },
];

interface Props {
  active: Set<Layer>;
  onToggle: (layer: Layer) => void;
}

export default function LayerFilter({ active, onToggle }: Props) {
  return (
    <div className="layer-bar">
      {LAYERS.map(({ key, label, emoji }) => (
        <button
          key={key}
          className={`layer-btn ${active.has(key) ? "active" : ""}`}
          onClick={() => onToggle(key)}
        >
          {emoji} {label}
        </button>
      ))}
    </div>
  );
}
