"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, QrCode, RotateCcw } from "lucide-react";

const DEFAULT_VALUE = "https://mihaplemenitas.com";
const DEFAULT_FOREGROUND = "#111216";
const DEFAULT_BACKGROUND = "#ffffff";

export function QrGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [size, setSize] = useState("320");
  const [foreground, setForeground] = useState(DEFAULT_FOREGROUND);
  const [background, setBackground] = useState(DEFAULT_BACKGROUND);

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
    setForeground(DEFAULT_FOREGROUND);
    setBackground(DEFAULT_BACKGROUND);
  }

  return (
    <div className="qr-generator grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div className="min-w-0 border border-line bg-surface p-6 sm:p-8">
        <label htmlFor="qr-content" className="text-sm font-semibold text-ink">
          Text or URL
        </label>
        <textarea
          id="qr-content"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://example.com"
          rows={5}
          className="mt-3 w-full resize-none border bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted"
        />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            Size
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 min-h-11 w-full border bg-paper px-3 py-2 font-normal text-ink"
            >
              <option value="240">Small</option>
              <option value="320">Medium</option>
              <option value="480">Large</option>
            </select>
          </label>
          <fieldset className="min-w-0 text-sm font-semibold text-ink">
            <legend>Colors</legend>
            <div className="mt-2 flex gap-2">
              <input
                aria-label="Foreground color"
                type="color"
                value={foreground}
                onChange={(event) => setForeground(event.target.value)}
                className="h-11 min-w-0 flex-1 cursor-pointer border bg-paper p-1"
              />
              <input
                aria-label="Background color"
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="h-11 min-w-0 flex-1 cursor-pointer border bg-paper p-1"
              />
            </div>
          </fieldset>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={downloadQr}
            disabled={!value.trim()}
            className="qr-primary inline-flex min-h-11 w-full items-center justify-center gap-2 border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Download size={16} /> Download PNG
          </button>
          <button
            onClick={reset}
            className="qr-secondary inline-flex min-h-11 w-full items-center justify-center gap-2 border px-3 py-2 text-sm font-semibold text-ink sm:w-auto"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted">
          <Link2 size={14} /> Your content stays in your browser.
        </p>
      </div>
      <div className="flex min-h-[300px] min-w-0 items-center justify-center border border-line bg-paper p-4 sm:min-h-[420px] sm:p-8">
        <div className="max-w-full border border-line bg-surface p-3 sm:p-4">
          {value.trim() ? (
            <canvas
              ref={canvasRef}
              className="block h-auto max-w-full"
              aria-label="Generated QR code"
            />
          ) : (
            <div className="flex aspect-square w-64 max-w-full flex-col items-center justify-center text-center text-muted">
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
