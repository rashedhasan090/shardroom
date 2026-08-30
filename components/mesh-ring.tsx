"use client";

import { useEffect, useState } from "react";
import type { DeviceInfo } from "@/lib/types";

type Lap = { id: number; born: number };

export function MeshRing({
  devices,
  generatorId,
  selfId,
  laps,
}: {
  devices: DeviceInfo[];
  generatorId: string | null;
  selfId: string | null;
  laps: number;
}) {
  const [embers, setEmbers] = useState<Lap[]>([]);

  useEffect(() => {
    if (laps <= 0) return;
    const id = laps;
    setEmbers((prev) => [...prev.slice(-10), { id, born: Date.now() }]);
    const timer = window.setTimeout(() => {
      setEmbers((prev) => prev.filter((e) => e.id !== id));
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [laps]);

  const nodes = devices.length > 0 ? devices : [];
  const cx = 200;
  const cy = 200;
  const r = 148;

  return (
    <svg viewBox="0 0 400 400" className="ember-ring mx-auto h-auto w-full max-w-md">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(224,138,60,0.35)"
        strokeWidth="2"
        strokeDasharray="6 10"
      />
      <circle cx={cx} cy={cy} r="36" fill="rgba(26,20,16,0.9)" stroke="rgba(224,138,60,0.4)" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#f4eadc"
        fontSize="11"
        fontFamily="var(--font-sans)"
      >
        the ring
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#d4b48a"
        fontSize="10"
        fontFamily="var(--font-sans)"
      >
        {nodes.length} shard{nodes.length === 1 ? "" : "s"}
      </text>

      {embers.map((ember, i) => (
        <circle
          key={ember.id}
          className="token-lap"
          r={5 + (i % 3)}
          fill="#f0b27a"
          opacity={0.9}
        />
      ))}

      {nodes.map((device, index) => {
        const angle = (-Math.PI / 2 + (2 * Math.PI * index) / Math.max(nodes.length, 1));
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const isGen = device.peerId === generatorId;
        const isSelf = device.peerId === selfId;
        return (
          <g key={device.peerId} transform={`translate(${x}, ${y})`}>
            <circle
              r={isGen ? 22 : 18}
              fill={isGen ? "#c45c26" : "#261c16"}
              stroke={isSelf ? "#f0b27a" : "rgba(244,234,220,0.35)"}
              strokeWidth={isSelf ? 3 : 1.5}
            />
            <text
              y={4}
              textAnchor="middle"
              fill="#f4eadc"
              fontSize="10"
              fontFamily="var(--font-sans)"
            >
              {device.name.slice(0, 4)}
            </text>
            <text
              y={36}
              textAnchor="middle"
              fill="#e7d3b8"
              fontSize="10"
              fontFamily="var(--font-sans)"
            >
              {device.name}
              {isGen ? " · kiln-bearer" : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
