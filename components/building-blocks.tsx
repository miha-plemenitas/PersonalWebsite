"use client";

import { useEffect, useState } from "react";

type Block = [string, string];

const palette = ["block-coral", "block-sand", "block-ink", "block-coral-soft"];

function makeShape(pattern: string[]) {
  return pattern.flatMap((row, rowIndex) =>
    [...row].flatMap((cell, columnIndex) => {
      if (cell !== "#") return [];
      return [
        [
          `col-start-${columnIndex + 1} row-start-${rowIndex + 1}`,
          palette[(rowIndex + columnIndex) % palette.length],
        ] as Block,
      ];
    }),
  );
}

const shapes: Block[][] = [
  [
    ["col-start-3 row-start-1", "block-coral"],
    ["col-start-2 row-start-2", "block-sand"],
    ["col-start-3 row-start-2", "block-ink"],
    ["col-start-4 row-start-2", "block-coral-soft"],
    ["col-start-1 row-start-3", "block-coral-soft"],
    ["col-start-2 row-start-3", "block-ink"],
    ["col-start-3 row-start-3", "block-sand"],
    ["col-start-4 row-start-3", "block-ink"],
    ["col-start-5 row-start-3", "block-coral-soft"],
    ["col-start-2 row-start-4", "block-sand"],
    ["col-start-3 row-start-4", "block-coral"],
    ["col-start-4 row-start-4", "block-sand"],
    ["col-start-3 row-start-5", "block-ink"],
  ],
  makeShape(["#...#", "##.##", "#.#.#", "#...#", "#...#"]),
  makeShape([".###.", "..#..", "..#..", "..#..", ".###."]),
  makeShape(["#...#", "#...#", "#####", "#...#", "#...#"]),
  makeShape([".###.", "#...#", "#####", "#...#", "#...#"]),
];

export function BuildingBlocks() {
  const [shapeIndex, setShapeIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setShapeIndex((current) => (current + 1) % shapes.length),
      7200,
    );
    return () => window.clearInterval(timer);
  }, []);

  const label =
    shapeIndex === 0
      ? "Abstract blocks assembling"
      : `Blocks assembling the letter ${"MIHA"[shapeIndex - 1]}`;
  const activeLabel = shapeIndex === 0 ? "FORM" : "MIHA"[shapeIndex - 1];
  return (
    <div className="building-stage" aria-label={`${label}; animation spells Miha`} role="img">
      <div className="building-orbit building-orbit-large" />
      <div className="building-orbit building-orbit-small" />
      <div className="building-grid" key={shapeIndex}>
        {shapes[shapeIndex].map(([position, color], index) => (
          <div key={`${position}-${index}`} className={`building-block ${position} ${color}`} />
        ))}
      </div>
      <div className="building-shadow" />
      <div className="building-caption">
        <span>BUILD / 01</span>
        <strong>{activeLabel}</strong>
      </div>
    </div>
  );
}
