"use client";

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
} from "react";

// ── Color math ────────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100;
  v /= 100;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v));
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface GradientFieldProps {
  hue: number;
  saturation: number;
  value: number;
  onChange: (s: number, v: number) => void;
}

function GradientField({ hue, saturation, value, onChange }: GradientFieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const s = clamp(((e.clientX - rect.left) / rect.width) * 100);
      const v = clamp(100 - ((e.clientY - rect.top) / rect.height) * 100);
      onChange(s, v);
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pick(e);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.stopPropagation();
    pick(e);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  // Thumb position
  const tx = saturation;
  const ty = 100 - value;

  return (
    <div
      ref={ref}
      data-no-drag="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        width: "100%",
        height: 160,
        borderRadius: 4,
        background: `hsl(${hue}, 100%, 50%)`,
        cursor: "crosshair",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* White overlay (saturation) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          background: "linear-gradient(to right, #fff 0%, transparent 100%)",
        }}
      />
      {/* Black overlay (value) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 4,
          background: "linear-gradient(to bottom, transparent 0%, #000 100%)",
        }}
      />
      {/* Thumb */}
      <div
        style={{
          position: "absolute",
          left: `${tx}%`,
          top: `${ty}%`,
          width: 12,
          height: 12,
          borderRadius: "50%",
          border: "2px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

interface SliderProps {
  value: number; // 0–360 for hue, 0–100 for others
  max: number;
  background: string;
  onChange: (v: number) => void;
  thumbColor?: string;
}

function Slider({ value, max, background, onChange, thumbColor }: SliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback(
    (e: PointerEvent | React.PointerEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const pct = clamp(((e.clientX - rect.left) / rect.width) * max, 0, max);
      onChange(pct);
    },
    [max, onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pick(e);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    pick(e);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={ref}
      data-no-drag="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: "relative",
        height: 12,
        borderRadius: 6,
        background,
        cursor: "ew-resize",
        userSelect: "none",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${(value / max) * 100}%`,
          top: "50%",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: thumbColor ?? "#fff",
          border: "2px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.25)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── Main ColorPicker ──────────────────────────────────────────────────────────

export interface ColorPickerProps {
  hex: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ hex, onChange }: ColorPickerProps) {
  const rgb = hexToRgb(hex);
  const [h, s, v] = rgb ? rgbToHsv(...rgb) : [0, 0, 100];

  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s);
  const [val, setVal] = useState(v);
  const [alpha, setAlpha] = useState(100);
  const [hexInput, setHexInput] = useState(hex.replace("#", "").toUpperCase());

  // When parent hex changes externally, re-sync
  useEffect(() => {
    const r = hexToRgb(hex);
    if (r) {
      const [nh, ns, nv] = rgbToHsv(...r);
      setHue(nh);
      setSat(ns);
      setVal(nv);
      setHexInput(hex.replace("#", "").toUpperCase());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex]);

  const emit = useCallback(
    (nh: number, ns: number, nv: number) => {
      const [r, g, b] = hsvToRgb(nh, ns, nv);
      const newHex = rgbToHex(r, g, b);
      setHexInput(newHex.replace("#", ""));
      onChange(newHex);
    },
    [onChange]
  );

  const handleSVChange = (ns: number, nv: number) => {
    setSat(ns);
    setVal(nv);
    emit(hue, ns, nv);
  };

  const handleHueChange = (nh: number) => {
    setHue(nh);
    emit(nh, sat, val);
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 6));
    if (raw.length === 6) {
      const r = hexToRgb(`#${raw}`);
      if (r) {
        const [nh, ns, nv] = rgbToHsv(...r);
        setHue(nh);
        setSat(ns);
        setVal(nv);
        onChange(`#${raw.toUpperCase()}`);
      }
    }
  };

  const [r, g, b] = hsvToRgb(hue, sat, val);
  const currentHex = rgbToHex(r, g, b);
  const hueColor = `hsl(${hue}, 100%, 50%)`;

  // Computed RGB display
  const handleRChannel = (raw: string) => {
    const n = Math.min(255, Math.max(0, parseInt(raw) || 0));
    const [nh, ns, nv] = rgbToHsv(n, g, b);
    setHue(nh); setSat(ns); setVal(nv);
    emit(nh, ns, nv);
  };
  const handleGChannel = (raw: string) => {
    const n = Math.min(255, Math.max(0, parseInt(raw) || 0));
    const [nh, ns, nv] = rgbToHsv(r, n, b);
    setHue(nh); setSat(ns); setVal(nv);
    emit(nh, ns, nv);
  };
  const handleBChannel = (raw: string) => {
    const n = Math.min(255, Math.max(0, parseInt(raw) || 0));
    const [nh, ns, nv] = rgbToHsv(r, g, n);
    setHue(nh); setSat(ns); setVal(nv);
    emit(nh, ns, nv);
  };

  return (
    <div
      data-no-drag="true"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: 232,
        background: "#FFFFFF",
        borderRadius: 10,
        border: "1px solid #E0E0DB",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.07)",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Gradient Field */}
      <div style={{ padding: "10px 10px 8px" }}>
        <GradientField
          hue={hue}
          saturation={sat}
          value={val}
          onChange={handleSVChange}
        />
      </div>

      <div style={{ padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Preview + sliders row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Current color preview chip */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: currentHex,
              border: "1px solid rgba(0,0,0,0.12)",
              flexShrink: 0,
            }}
          />
          {/* Sliders stack */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Slider
              value={hue}
              max={360}
              background="linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"
              onChange={handleHueChange}
              thumbColor={hueColor}
            />
            <Slider
              value={alpha}
              max={100}
              background={`linear-gradient(to right, transparent, ${currentHex})`}
              onChange={setAlpha}
              thumbColor={currentHex}
            />
          </div>
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", gap: 5 }}>
          {/* HEX */}
          <div style={{ flex: 2 }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                textTransform: "uppercase",
                color: "#969690",
                marginBottom: 3,
                letterSpacing: "0.05em",
              }}
            >
              HEX
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #EBEBE7",
                borderRadius: 5,
                overflow: "hidden",
                background: "#FAFAF8",
              }}
            >
              <span
                style={{
                  padding: "3px 0 3px 7px",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#969690",
                }}
              >
                #
              </span>
              <input
                type="text"
                value={hexInput}
                maxLength={6}
                onChange={(e) => handleHexInput(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#191918",
                  padding: "3px 7px 3px 2px",
                  width: 0,
                }}
              />
            </div>
          </div>

          {/* R */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#969690", marginBottom: 3, textAlign: "center", fontFamily: "monospace" }}>R</div>
            <input
              type="number"
              min={0}
              max={255}
              value={r}
              onChange={(e) => handleRChannel(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={inputStyle}
            />
          </div>
          {/* G */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#969690", marginBottom: 3, textAlign: "center", fontFamily: "monospace" }}>G</div>
            <input
              type="number"
              min={0}
              max={255}
              value={g}
              onChange={(e) => handleGChannel(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={inputStyle}
            />
          </div>
          {/* B */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#969690", marginBottom: 3, textAlign: "center", fontFamily: "monospace" }}>B</div>
            <input
              type="number"
              min={0}
              max={255}
              value={b}
              onChange={(e) => handleBChannel(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Preset swatches */}
        <div style={{ borderTop: "1px solid #EBEBE7", paddingTop: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {PRESET_SWATCHES.map((sw) => (
              <button
                key={sw}
                data-no-drag="true"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rgb = hexToRgb(sw);
                  if (rgb) {
                    const [nh, ns, nv] = rgbToHsv(...rgb);
                    setHue(nh); setSat(ns); setVal(nv);
                    setHexInput(sw.replace("#", "").toUpperCase());
                    onChange(sw);
                  }
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: sw,
                  border: sw === currentHex ? "2px solid #191918" : "1px solid rgba(0,0,0,0.12)",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #EBEBE7",
  borderRadius: 5,
  outline: "none",
  background: "#FAFAF8",
  fontSize: 11,
  fontFamily: "monospace",
  color: "#191918",
  textAlign: "center",
  padding: "3px 2px",
  MozAppearance: "textfield",
};

const PRESET_SWATCHES = [
  "#191918",
  "#3A3A36",
  "#5A5A55",
  "#8F8E88",
  "#BCBCB6",
  "#E8E7E2",
  "#FBFBFA",
  "#FFFFFF",
  "#B5451B",
  "#D4672A",
  "#E8973A",
  "#F2C744",
  "#4C8B5D",
  "#2E7D6E",
  "#2563EB",
  "#6D28D9",
];
