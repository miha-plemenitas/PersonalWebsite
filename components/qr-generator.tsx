"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, QrCode, RotateCcw } from "lucide-react";

const DEFAULT_VALUE = "https://mihaplemenitas.com";

export function QrGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [size, setSize] = useState("320");
  const [foreground, setForeground] = useState("#1d211d");
  const [background, setBackground] = useState("#ffffff");

  useEffect(() => {
    if (!canvasRef.current || !value.trim()) return;
    QRCode.toCanvas(canvasRef.current, value.trim(), {
      width: Number(size),
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: foreground, light: background },
    });
  }, [background, foreground, size, value]);

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function reset() {
    setValue("");
    setSize("320");
    setForeground("#1d211d");
    setBackground("#ffffff");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
        <label htmlFor="qr-content" className="text-sm font-semibold text-ink">
          Text or URL
        </label>
        <textarea
          id="qr-content"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://example.com"
          rows={5}
          className="mt-3 w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-coral focus:outline-none"
        />
        <div className="mt-7 grid grid-cols-2 gap-5">
          <label className="text-sm font-semibold text-ink">
            Size
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2.5 font-normal text-ink"
            >
              <option value="240">Small</option>
              <option value="320">Medium</option>
              <option value="480">Large</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-ink">
            Colors
            <div className="mt-2 flex gap-2">
              <input
                aria-label="Foreground color"
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-line bg-paper p-1"
              />
              <input
                aria-label="Background color"
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-xl border border-line bg-paper p-1"
              />
            </div>
          </label>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={downloadQr}
            disabled={!value.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={16} /> Download PNG
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink hover:bg-paper"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted">
          <Link2 size={14} /> Your content stays in your browser.
        </p>
      </div>
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-line bg-sand/60 p-8">
        <div className="rounded-2xl bg-surface p-5 shadow-lg shadow-ink/5">
          {value.trim() ? (
            <canvas ref={canvasRef} aria-label="Generated QR code" />
          ) : (
            <div className="flex size-64 flex-col items-center justify-center text-center text-muted">
              <QrCode className="mb-3" size={30} strokeWidth={1.5} />
              <p className="text-sm">
                Enter some text to
                <br />
                preview your QR code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
