"use client";

import { CloudRain, Users, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  lang: string;
}

interface StatusData {
  temp: number;
  congestion_ko: string;
  congestion_en: string;
  rainChance: string;
}

export default function StatusCard({ lang }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error(err));
  }, []);

  if (!status) return null;

  return (
    <div className="status-card">
      <div className="status-item text-white">
        <Thermometer size={14} className="text-orange-400" />
        {status.temp}°C
        <span className="opacity-50 mx-1">|</span>
        <CloudRain size={14} className="text-blue-300" />
        {status.rainChance}
      </div>
      <div className="status-item mt-1">
        <Users size={14} className="text-purple-400" />
        <span className="text-purple-100">
          {lang === "ko" ? status.congestion_ko : status.congestion_en}
        </span>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
      </div>
    </div>
  );
}
