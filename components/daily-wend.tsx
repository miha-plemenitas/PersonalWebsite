"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, RotateCcw, Undo2 } from "lucide-react";

type Puzzle = { id: string; title: string; cells: (string | null)[]; words: string[]; wordPaths: number[][] };
type Move = { word: string; path: number[]; correct: boolean };

const WORD_BANKS = {
  3: ["USE", "TRY", "MAP", "WIN", "RUN", "FIT"],
  4: ["WIND", "FLOW", "CODE", "PLAY", "FORM", "GRID"],
  5: ["BRAVE", "CRAFT", "TOOLS", "SCOPE", "PIXEL", "TRACE", "DAILY", "NODES", "CLEAR", "DRIFT"],
  6: ["BRIGHT", "SIGNAL", "DESIGN", "CREATE", "SYSTEM", "SHAPES"],
  7: ["SYSTEMS", "PRODUCT", "MACHINE", "QUALITY", "CURIOUS", "BALANCE"],
};

const COLS = 6;
const BASE_PATH = [0, 1, 7, 6, 12, 18, 24, 30, 31, 25, 19, 13, 14, 15, 16, 22, 28, 27, 26, 32, 33, 34, 35, 29, 23, 17, 11, 5, 4, 10];

function mirrorPath(path: number[], axis: "horizontal" | "vertical") {
  return path.map((index) => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    return axis === "horizontal" ? row * COLS + (COLS - 1 - col) : (5 - row) * COLS + col;
  });
}

const BOARD_PATHS = [BASE_PATH, mirrorPath(BASE_PATH, "horizontal"), mirrorPath(BASE_PATH, "vertical")];

function dailyPuzzle() {
  const now = new Date();
  const start = Date.UTC(2026, 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = Math.floor((today - start) / 86_400_000);
  let seed = Math.abs(day * 9301 + 49297) % 233280;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const usedWords = new Set<string>();
  function pick(length: keyof typeof WORD_BANKS) {
    const bank = WORD_BANKS[length];
    const available = bank.filter((word) => !usedWords.has(word));
    const word = available[Math.floor(random() * available.length)];
    usedWords.add(word);
    return word;
  }
  const lengths: (keyof typeof WORD_BANKS)[] = [3, 4, 5, 5, 6, 7];
  lengths.sort(() => random() - 0.5);
  const words = lengths.map((length) => pick(length));
  const solutionPath = BOARD_PATHS[Math.floor(random() * BOARD_PATHS.length)];
  const cells: (string | null)[] = Array(36).fill(null);
  words.join("").split("").forEach((letter, index) => { cells[solutionPath[index]] = letter; });
  let wordOffset = 0;
  const wordPaths = words.map((word) => {
    const wordPath = solutionPath.slice(wordOffset, wordOffset + word.length);
    wordOffset += word.length;
    return wordPath;
  });
  const titles = ["A small daily loop", "Find the clear signal", "A useful little puzzle", "Take the long way"];
  const puzzle = { id: `day-${day}`, title: titles[Math.floor(random() * titles.length)], cells, words, wordPaths };
  return { puzzle, day };
}

function storageKey(puzzleId: string) {
  return `miha-wend-v3-${puzzleId}`;
}

function isValidMove(move: Move, puzzle: Puzzle) {
  const wordIndex = puzzle.words.indexOf(move.word);
  if (wordIndex < 0) return false;
  const expected = puzzle.wordPaths[wordIndex];
  const actual = move.path.join(",");
  return expected.join(",") === actual || [...expected].reverse().join(",") === actual;
}

function areAdjacent(first: number, second: number) {
  return Math.abs(Math.floor(first / COLS) - Math.floor(second / COLS)) + Math.abs((first % COLS) - (second % COLS)) === 1;
}

export function DailyWend() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [moves, setMoves] = useState<Move[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [openPanel, setOpenPanel] = useState<string | null>("how");
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = dailyPuzzle();
    setPuzzle(current.puzzle);
    setDayNumber(current.day + 1);
    try {
      const saved = window.localStorage.getItem(storageKey(current.puzzle.id));
      if (saved) {
        const savedMoves = JSON.parse(saved) as Move[];
        setMoves(savedMoves.filter((move) => isValidMove(move, current.puzzle)));
      }
    } catch {
      // Private browsing contexts may not allow local storage.
    }
  }, []);

  useEffect(() => {
    if (!puzzle) return;
    const validMoves = moves.filter((move) => isValidMove(move, puzzle));
    if (validMoves.length !== moves.length) {
      setMoves(validMoves);
      return;
    }
    if (validMoves.length === 0) {
      window.localStorage.removeItem(storageKey(puzzle.id));
      return;
    }
    window.localStorage.setItem(storageKey(puzzle.id), JSON.stringify(validMoves));
  }, [moves, puzzle]);

  const letters = puzzle?.cells ?? [];
  const validMoves = useMemo(() => puzzle ? moves.filter((move) => isValidMove(move, puzzle)) : [], [moves, puzzle]);
  const usedCells = useMemo(() => new Set(validMoves.flatMap((move) => move.path)), [validMoves]);
  const cellWordIndex = useMemo(() => {
    const result = new Map<number, number>();
    validMoves.forEach((move) => move.path.forEach((cell) => result.set(cell, puzzle?.words.indexOf(move.word) ?? 0)));
    return result;
  }, [validMoves, puzzle]);
  const foundWords = new Set(validMoves.filter((move) => move.correct).map((move) => move.word));
  const completed = Boolean(puzzle && foundWords.size === puzzle.words.length);

  function startPath(index: number) {
    if (usedCells.has(index) || completed) return;
    setNotice("");
    setPath([index]);
    setIsDragging(true);
  }

  function extendPath(index: number) {
    if (!isDragging || path.includes(index) || usedCells.has(index)) return;
    const last = path[path.length - 1];
    if (areAdjacent(last, index)) setPath((current) => [...current, index]);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-cell-index]");
    const index = target?.dataset.cellIndex;
    if (index === undefined) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startPath(Number(index));
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || !gridRef.current) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-cell-index]");
    if (!target || !gridRef.current.contains(target)) return;
    const index = target.dataset.cellIndex;
    if (index !== undefined) extendPath(Number(index));
  }

  function finishPath() {
    if (!isDragging) return;
    if (!puzzle) return;
    setIsDragging(false);
    if (path.length < 2) {
      setPath([]);
      return;
    }
    const word = path.map((index) => letters[index]).join("");
    const reverseWord = [...word].reverse().join("");
    const answerIndex = puzzle.wordPaths.findIndex((wordPath) => wordPath.join(",") === path.join(",") || [...wordPath].reverse().join(",") === path.join(","));
    const answer = answerIndex === undefined || answerIndex < 0 ? undefined : puzzle.words[answerIndex];
    if (!answer || foundWords.has(answer) || (answer !== word && answer !== reverseWord)) {
      setNotice(`${word} is not one of today’s words.`);
      setPath([]);
      return;
    }
    setMoves((current) => [...current, { word: answer, path, correct: true }]);
    setNotice(answer);
    setPath([]);
  }

  function undo() {
    setMoves((current) => current.slice(0, -1));
    setNotice("");
  }

  function reset() {
    setMoves([]);
    setPath([]);
    setNotice("");
    if (puzzle) window.localStorage.removeItem(storageKey(puzzle.id));
  }

  function hint() {
    if (!puzzle || completed) return;
    const nextWord = puzzle.words.find((word) => !foundWords.has(word));
    if (!nextWord) return;
    setNotice(`Hint: try “${nextWord}”.`);
  }

  if (!puzzle) return <div className="wend-loading">Preparing today&apos;s puzzle…</div>;

  return (
    <div className="wend-shell">
      <div className="wend-topline">
        <div><p className="wend-kicker">Daily puzzle · #{dayNumber}</p><h1>{puzzle.title}</h1></div>
        <div className="wend-status"><span className={completed ? "wend-status-dot is-complete" : "wend-status-dot"} />{completed ? "Solved" : `${foundWords.size}/${puzzle.words.length} words`}</div>
      </div>
      <div className="wend-board-card">
        <p className="wend-instruction">Drag horizontally or vertically. No diagonals. Use every tile once.</p>
        <div ref={gridRef} className="wend-grid" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPath} onPointerCancel={finishPath}>
          {letters.map((letter, index) => {
            if (letter === null) return <div className="wend-obstacle" key={`${puzzle.id}-obstacle-${index}`} aria-hidden="true" />;
            const selected = path.includes(index);
            const used = usedCells.has(index);
            const wordIndex = cellWordIndex.get(index);
            const previewIndex = path.length > 0 ? path[0] % 6 : 0;
            return <button type="button" data-cell-index={index} className={`wend-cell ${selected ? "is-selected" : ""} ${used ? "is-used" : ""} ${wordIndex !== undefined ? `wend-word-${wordIndex}` : ""} ${selected ? `wend-preview-${previewIndex}` : ""}`} key={`${puzzle.id}-${index}`} aria-label={`Letter ${letter}, row ${Math.floor(index / COLS) + 1}, column ${(index % COLS) + 1}`}><span>{letter}</span>{selected && <i>{path.indexOf(index) + 1}</i>}</button>;
          })}
        </div>
        <div className="wend-answers" aria-label="Words to find">
          {puzzle.words.map((word, wordIndex) => <div className={`wend-answer wend-answer-${wordIndex} ${foundWords.has(word) ? "is-found" : ""}`} key={word}>{foundWords.has(word) ? <Check size={15} /> : <span>{word.length}</span>}<span>{foundWords.has(word) ? word : "_ ".repeat(word.length).trim()}</span></div>)}
        </div>
        <div className="wend-controls">
          <button type="button" onClick={undo} disabled={validMoves.length === 0}><Undo2 size={16} /> Undo</button>
          <button type="button" onClick={hint} disabled={completed}>Hint</button>
          <button type="button" onClick={reset}><RotateCcw size={15} /> Reset</button>
        </div>
        <p className={`wend-notice ${completed ? "is-success" : ""}`} aria-live="polite">{completed ? "Nice work — come back tomorrow for a fresh board." : notice || ""}</p>
      </div>
      <div className="wend-panels">
        {[["how", "How to play", "Trace horizontally or vertically to spell a word. Diagonal moves are not allowed. Release to submit it. Every letter belongs to exactly one word."], ["daily", "Daily rules", "One new board is selected every day at midnight UTC. Your progress stays saved in this browser until the next board."]].map(([id, title, body]) => <div className="wend-panel" key={id}><button type="button" onClick={() => setOpenPanel(openPanel === id ? null : id)}><span>{title}</span><ChevronDown size={17} className={openPanel === id ? "is-open" : ""} /></button>{openPanel === id && <p>{body}</p>}</div>)}
      </div>
    </div>
  );
}
