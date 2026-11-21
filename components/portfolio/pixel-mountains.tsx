"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import styles from "./pixel-mountains.module.css";

type Ridge = {
  outline: readonly (readonly [number, number])[];
  seed: number;
  relief: number;
  snow: number;
  colors: readonly [string, string, string, string, string, string];
};

const ridges: Ridge[] = [
  {
    outline: [
      [-0.05, 0.94],
      [0.18, 0.87],
      [0.34, 0.78],
      [0.42, 0.81],
      [0.53, 0.65],
      [0.57, 0.71],
      [0.63, 0.59],
      [0.68, 0.67],
      [0.73, 0.56],
      [0.82, 0.69],
      [0.88, 0.58],
      [0.97, 0.64],
      [1.05, 0.52],
    ],
    seed: 19,
    relief: 0.023,
    snow: 0.14,
    colors: ["#10142d", "#181f48", "#202b5d", "#303d73", "#475688", "#65729d"],
  },
  {
    outline: [
      [-0.05, 1],
      [0.24, 0.94],
      [0.39, 0.88],
      [0.48, 0.79],
      [0.55, 0.83],
      [0.65, 0.69],
      [0.69, 0.64],
      [0.735, 0.52],
      [0.755, 0.55],
      [0.79, 0.36],
      [0.811, 0.42],
      [0.833, 0.395],
      [0.867, 0.56],
      [0.91, 0.635],
      [0.95, 0.586],
      [1, 0.69],
      [1.05, 0.61],
    ],
    seed: 73,
    relief: 0.027,
    snow: 0.115,
    colors: ["#0e163e", "#16235f", "#1d2f80", "#354a96", "#8493c3", "#e3e5ef"],
  },
  {
    outline: [
      [-0.05, 1],
      [0.12, 0.96],
      [0.23, 0.99],
      [0.36, 0.92],
      [0.49, 0.95],
      [0.59, 0.83],
      [0.65, 0.875],
      [0.71, 0.8],
      [0.77, 0.89],
      [0.83, 0.83],
      [0.89, 0.89],
      [0.96, 0.77],
      [1.05, 0.83],
    ],
    seed: 141,
    relief: 0.027,
    snow: 0,
    colors: ["#070910", "#0a0e1d", "#10172e", "#1b2444", "#252f56", "#364267"],
  },
];

function hash(x: number, y: number, seed: number) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, seed: number) {
  const cell = Math.floor(x);
  const fraction = x - cell;
  const blend = fraction * fraction * (3 - 2 * fraction);
  return hash(cell, 0, seed) * (1 - blend) + hash(cell + 1, 0, seed) * blend;
}

function elevation(x: number, ridge: Ridge) {
  const { outline, seed, relief } = ridge;
  const right = outline.findIndex(([point]) => point >= x);
  const index = right < 0 ? outline.length - 1 : Math.max(1, right);
  const [fromX, fromY] = outline[index - 1];
  const [toX, toY] = outline[index];
  return (
    fromY +
    ((x - fromX) / (toX - fromX)) * (toY - fromY) +
    (noise(x * 50, seed) - 0.5) * relief +
    (noise(x * 177, seed) - 0.5) * relief * 0.45
  );
}

function drawRidge(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  ridge: Ridge,
  compact: boolean,
) {
  for (let x = 0; x < width; x++) {
    // Frame the twin summit nearer the center and below the stacked mobile copy.
    const position = compact ? (x / width) * 0.83 + 0.29 : x / width;
    const elevationAtX = elevation(position, ridge);
    const crest = compact ? 1 - (1 - elevationAtX) * 0.71 : elevationAtX;
    const slope = (elevation(position + 0.009, ridge) - elevation(position - 0.009, ridge)) / 0.018;

    for (let y = Math.max(0, Math.ceil(crest * height)); y < height; y++) {
      const depth = y / height - crest;
      // Widen the gullies downhill and bend them around pockets of rock.
      const valley = position + depth * (0.31 + noise(position * 11, ridge.seed) * 0.59);
      const striation =
        noise(valley * 99, ridge.seed) * 0.63 + noise(valley * 216 + depth * 8, ridge.seed) * 0.37;
      const grain = (hash(x, y, ridge.seed) - 0.5) * 0.31;
      const light = striation + grain - Math.tanh(slope) * 0.24 - depth * 1.58;
      const snowline = ridge.snow * (noise(valley * 47, ridge.seed) * 0.94 + 0.22);
      const snow = depth < snowline && crest < 0.73 && light > 0.38;
      const shade = snow
        ? light > 0.69
          ? 5
          : 4
        : Math.max(0, Math.min(3, Math.floor(light * 4.6)));
      context.fillStyle = ridge.colors[shade];
      context.fillRect(x, y, 1, 1);
    }
  }
}

function drawStars(context: CanvasRenderingContext2D, width: number, height: number) {
  const count = Math.round(width * 0.46);
  for (let index = 0; index < count; index++) {
    const x = hash(index, 0, 11);
    const y = hash(index, 0, 91);
    const light = hash(index, 0, 200);
    const emphasis = 0.22 + x * 0.66;
    context.globalAlpha = emphasis * (0.2 + light * 0.67);
    context.fillStyle = light > 0.96 ? "#d7b584" : light > 0.82 ? "#f5f3ef" : "#8392c1";
    context.fillRect(Math.floor(x * width), Math.floor((0.14 + y * 0.53) * height), 1, 1);
  }
  context.globalAlpha = 1;
}

function drawMist(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  compact: boolean,
) {
  // Broken horizontal wisps sit across the valley behind the foreground ridge.
  for (let band = 0; band < 48; band++) {
    const spread = hash(band, 0, 227);
    const x = Math.floor(((compact ? 0.16 : 0.48) + hash(band, 0, 51) * 0.52) * width);
    const y = Math.floor(((compact ? 0.74 : 0.68) + spread * 0.16) * height);
    const length = Math.ceil((0.015 + hash(band, 0, 161) * 0.13) * width);
    context.globalAlpha = 0.09 + hash(band, 0, 44) * 0.19;
    context.fillStyle = spread < 0.58 ? "#788cc7" : "#465fa4";
    context.fillRect(x, y, length, 1);
    if (length > 16) context.fillRect(x + 3, y + 1, Math.floor(length * 0.62), 1);
  }
  context.globalAlpha = 1;
}

function drawSnow(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  compact: boolean,
) {
  for (let index = 0; index < 44; index++) {
    const startX = compact ? 0.12 : 0.39;
    const startY = compact ? 0.48 : 0.2;
    const x = Math.floor((startX + hash(index, 0, 81) * (1 - startX)) * width);
    const spreadY = compact ? 0.42 : 0.63;
    const y = Math.floor((startY + hash(index, 0, 138) * spreadY) * height);
    context.globalAlpha = 0.18 + hash(index, 0, 193) * 0.44;
    context.fillStyle = "#dce6ff";
    context.fillRect(x, y, 1, 1);
  }
  context.globalAlpha = 1;
}

export function PixelMountains() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { duration: 0.5, bounce: 0.12 });
  const y = useSpring(0, { duration: 0.5, bounce: 0.12 });
  const farX = useTransform(x, (value) => value * 0.28);
  const farY = useTransform(y, (value) => value * 0.28);
  const middleX = useTransform(x, (value) => value * 0.66);
  const middleY = useTransform(y, (value) => value * 0.66);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const canvases = [...scene.querySelectorAll("canvas")];
    const contexts = canvases.map((canvas) => canvas.getContext("2d"));
    if (contexts.some((context) => !context)) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let inView = !("IntersectionObserver" in window);
    let tracking = false;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");

    function draw() {
      frame = 0;
      if (!scene || !inView || document.hidden) return;
      const compact = scene.clientWidth < 768;
      const pixelSize = compact ? 3 : 4;
      const nextWidth = Math.max(1, Math.ceil((scene.clientWidth + 24) / pixelSize));
      const nextHeight = Math.max(1, Math.ceil((scene.clientHeight + 24) / pixelSize));
      if (nextWidth === width && nextHeight === height) return;
      width = nextWidth;
      height = nextHeight;
      canvases.forEach((canvas, index) => {
        const context = contexts[index];
        if (!context) return;
        canvas.width = width;
        canvas.height = height;
        if (index === 0) drawStars(context, width, height);
        else if (index === 3) drawMist(context, width, height, compact);
        else if (index === 5) drawSnow(context, width, height, compact);
        else drawRidge(context, width, height, ridges[index === 4 ? 2 : index - 1], compact);
      });
      scene.dataset.ready = "";
    }

    function scheduleDraw() {
      if (inView && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    }

    function recenter() {
      x.set(0);
      y.set(0);
    }

    function move(event: PointerEvent) {
      if (!scene || event.pointerType !== "mouse") return;
      const bounds = scene.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width;
      const vertical = (event.clientY - bounds.top) / bounds.height;
      x.set((0.5 - horizontal) * 22);
      y.set((0.5 - vertical) * 14);
    }

    const hero = scene.parentElement;

    function removePointerListeners() {
      hero?.removeEventListener("pointermove", move);
      hero?.removeEventListener("pointerleave", recenter);
    }

    function syncActivity() {
      const visible = inView && !document.hidden;
      const active = visible && !reducedMotion.matches;
      scene?.toggleAttribute("data-active", active);
      const shouldTrack = active && finePointer.matches;
      if (shouldTrack !== tracking) {
        tracking = shouldTrack;
        if (tracking) {
          hero?.addEventListener("pointermove", move, { passive: true });
          hero?.addEventListener("pointerleave", recenter, { passive: true });
        } else {
          removePointerListeners();
        }
      }
      if (!shouldTrack) {
        x.jump(0);
        y.jump(0);
      }
      if (visible) scheduleDraw();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    const resize = new ResizeObserver(scheduleDraw);
    resize.observe(scene);
    const intersection =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            syncActivity();
          })
        : null;
    intersection?.observe(scene);

    reducedMotion.addEventListener("change", syncActivity);
    finePointer.addEventListener("change", syncActivity);
    document.addEventListener("visibilitychange", syncActivity);
    syncActivity();

    return () => {
      resize.disconnect();
      intersection?.disconnect();
      cancelAnimationFrame(frame);
      removePointerListeners();
      reducedMotion.removeEventListener("change", syncActivity);
      finePointer.removeEventListener("change", syncActivity);
      document.removeEventListener("visibilitychange", syncActivity);
    };
  }, [x, y]);

  return (
    <div className={styles.scene} ref={sceneRef} aria-hidden="true">
      <div className={styles.fallback} />
      <div className={styles.airglow} />
      <canvas className={styles.stars} />
      <motion.canvas className={styles.layer} style={{ x: farX, y: farY }} />
      <motion.canvas className={styles.layer} style={{ x: middleX, y: middleY }} />
      <canvas className={`${styles.layer} ${styles.mist}`} />
      <motion.canvas className={styles.layer} style={{ x, y }} />
      <canvas className={`${styles.layer} ${styles.snow}`} />
    </div>
  );
}
