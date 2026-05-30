import { useState, useRef, useEffect, useCallback } from "react";

/* ============================ Game data ============================ */
const SIZE = 8;

const COLORS = [
  "#ff4d6d", "#ff8c42", "#ffd23f", "#4ade80",
  "#2dd4bf", "#38bdf8", "#818cf8", "#c084fc", "#f472b6",
];

const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],                                 // 2x2
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // 3x3
  [[0, 0], [1, 0], [1, 1]],                                         // L corners
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],                         // big L
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],                                 // T
  [[0, 1], [1, 0], [1, 1], [2, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],                                 // S / Z
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],                 // 2x3
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],                 // 3x2
];

const shapeW = (s) => Math.max(...s.map((c) => c[1])) + 1;
const shapeH = (s) => Math.max(...s.map((c) => c[0])) + 1;
const emptyBoard = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

function canPlace(board, shape, r, c) {
  for (const [dr, dc] of shape) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) return false;
    if (board[rr][cc]) return false;
  }
  return true;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function placeOnBoard(board, shape, color, r, c) {
  const nb = cloneBoard(board);
  for (const [dr, dc] of shape) nb[r + dr][c + dc] = color;
  return nb;
}

function fullLines(board) {
  const rows = [], cols = [];
  for (let r = 0; r < SIZE; r++) if (board[r].every((x) => x)) rows.push(r);
  for (let c = 0; c < SIZE; c++) {
    let f = true;
    for (let r = 0; r < SIZE; r++) if (!board[r][c]) { f = false; break; }
    if (f) cols.push(c);
  }
  return { rows, cols };
}

function getPlacements(board, shape) {
  const placements = [];
  const maxR = SIZE - shapeH(shape);
  const maxC = SIZE - shapeW(shape);
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      if (canPlace(board, shape, r, c)) placements.push([r, c]);
    }
  }
  return placements;
}

const PERMS = [
  [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
];

function countSolutions(board, shapes, limit = 50) {
  let count = 0;
  for (const perm of PERMS) {
    const p0 = shapes[perm[0]], p1 = shapes[perm[1]], p2 = shapes[perm[2]];
    const places0 = getPlacements(board, p0);
    if (places0.length === 0) continue;
    for (const [r0, c0] of places0) {
      const b1 = placeOnBoard(board, p0, "#", r0, c0);
      const places1 = getPlacements(b1, p1);
      if (places1.length === 0) continue;
      for (const [r1, c1] of places1) {
        const b2 = placeOnBoard(b1, p1, "#", r1, c1);
        const places2 = getPlacements(b2, p2);
        count += places2.length;
        if (count >= limit) return count;
      }
    }
  }
  return count;
}

function countComboSolutions(board, shapes, limit = 30) {
  let count = 0;
  for (const perm of PERMS) {
    const p0 = shapes[perm[0]], p1 = shapes[perm[1]], p2 = shapes[perm[2]];
    const places0 = getPlacements(board, p0);
    if (places0.length === 0) continue;
    for (const [r0, c0] of places0) {
      const b1 = placeOnBoard(board, p0, "#", r0, c0);
      const lines1 = fullLines(b1);
      const combo1 = lines1.rows.length + lines1.cols.length > 0;
      const places1 = getPlacements(b1, p1);
      if (places1.length === 0) continue;
      for (const [r1, c1] of places1) {
        const b2 = placeOnBoard(b1, p1, "#", r1, c1);
        const lines2 = fullLines(b2);
        const combo2 = lines2.rows.length + lines2.cols.length > 0;
        const places2 = getPlacements(b2, p2);
        if (places2.length === 0) continue;
        if (combo1 || combo2) {
          count += places2.length;
          if (count >= limit) return count;
        } else {
          for (const [r2, c2] of places2) {
            const b3 = placeOnBoard(b2, p2, "#", r2, c2);
            const lines3 = fullLines(b3);
            if (lines3.rows.length + lines3.cols.length > 0) {
              count++;
              if (count >= limit) return count;
            }
          }
        }
      }
    }
  }
  return count;
}

function targetSolutions(score) {
  if (score < 200) return 40;
  if (score < 500) return 25;
  if (score < 1000) return 15;
  if (score < 2000) return 8;
  if (score < 4000) return 4;
  return 1;
}

let _pid = 0;
const randPiece = () => ({
  id: ++_pid,
  shape: SHAPES[(Math.random() * SHAPES.length) | 0],
  color: COLORS[(Math.random() * COLORS.length) | 0],
});

function generateFairThree(board, score) {
  const target = targetSolutions(score);
  let bestSet = null;
  let bestDiff = Infinity;
  // 1) try to find a set that guarantees at least one combo solution
  for (let i = 0; i < 120; i++) {
    const set = [randPiece(), randPiece(), randPiece()];
    const comboSol = countComboSolutions(board, set.map((p) => p.shape), 40);
    if (comboSol === 0) continue;
    const diff = Math.abs(comboSol - target);
    if (diff < bestDiff) { bestDiff = diff; bestSet = set; }
    if (diff <= 5) return bestSet;
  }
  // 2) fallback: any valid solution (fair but maybe no guaranteed combo)
  if (!bestSet) {
    for (let i = 0; i < 200; i++) {
      const set = [randPiece(), randPiece(), randPiece()];
      const sol = countSolutions(board, set.map((p) => p.shape), 60);
      if (sol === 0) continue;
      const diff = Math.abs(sol - target);
      if (diff < bestDiff) { bestDiff = diff; bestSet = set; }
      if (diff <= 3) break;
    }
  }
  if (!bestSet) {
    for (let i = 0; i < 300; i++) {
      const set = [randPiece(), randPiece(), randPiece()];
      const sol = countSolutions(board, set.map((p) => p.shape), 60);
      if (sol > 0) { bestSet = set; break; }
    }
  }
  return bestSet || [randPiece(), randPiece(), randPiece()];
}

const blockStyle = (color) => ({
  background: `linear-gradient(160deg, color-mix(in srgb, ${color}, white 58%) 0%, ${color} 45%, color-mix(in srgb, ${color}, black 32%) 100%)`,
  boxShadow:
    `inset 0 2.5px 0 rgba(255,255,255,.65), inset 0 -4px 7px rgba(0,0,0,.4), 0 3px 5px rgba(0,0,0,.4), 0 0 16px ${color}55`,
});

/* ============================ Component ============================ */
export default function BlockBlast() {
  const [board, setBoard] = useState(emptyBoard);
  const [pieces, setPieces] = useState(() => generateFairThree(emptyBoard(), 0));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [drag, setDrag] = useState(null);
  const [clearing, setClearing] = useState(new Set());
  const [fresh, setFresh] = useState(new Set());
  const [floats, setFloats] = useState([]);
  const [anim, setAnim] = useState(false);
  const [over, setOver] = useState(false);

  const boardRef = useRef(null);
  const gridRef = useRef(board);
  const piecesRef = useRef(pieces);
  const streakRef = useRef(streak);
  const bestRef = useRef(best);
  const dragRef = useRef(drag);
  const comboThisTurnRef = useRef(false);
  const animRef = useRef(false);
  const scoreRef = useRef(0);

  useEffect(() => { gridRef.current = board; }, [board]);
  useEffect(() => { piecesRef.current = pieces; }, [pieces]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { bestRef.current = best; }, [best]);
  useEffect(() => { dragRef.current = drag; }, [drag]);
  useEffect(() => { animRef.current = anim; }, [anim]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // load persisted best
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage?.get("bb_best");
        if (r && r.value) { const v = +r.value; setBest(v); bestRef.current = v; }
      } catch (_) {
        try {
          const v = localStorage.getItem("bb_best");
          if (v) { const n = +v; setBest(n); bestRef.current = n; }
        } catch (__) {}
      }
    })();
  }, []);
  const saveBest = (v) => {
    try { window.storage?.set("bb_best", String(v)); } catch (_) {}
    try { localStorage.setItem("bb_best", String(v)); } catch (_) {}
  };

  const bumpScore = useCallback((add) => {
    setScore((s) => {
      const ns = s + add;
      if (ns > bestRef.current) { bestRef.current = ns; setBest(ns); saveBest(ns); }
      return ns;
    });
  }, []);

  const pushFloat = useCallback((text, sub) => {
    const id = Math.random();
    setFloats((f) => [...f, { id, text, sub }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100);
  }, []);



  const finalize = useCallback((bd) => {
    const t = generateFairThree(bd, scoreRef.current);
    setPieces(t); piecesRef.current = t;
    comboThisTurnRef.current = false;
    if (!t.some((p) => getPlacements(bd, p.shape).length > 0)) setOver(true);
  }, []);

  const applyPlacement = useCallback((idx, shape, color, r, c) => {
    if (animRef.current) return;
    const cur = gridRef.current;
    const nb = cloneBoard(cur);
    const placed = new Set();
    for (const [dr, dc] of shape) {
      nb[r + dr][c + dc] = color;
      placed.add(`${r + dr}-${c + dc}`);
    }
    const np = piecesRef.current.map((p, i) => (i === idx ? null : p));
    setPieces(np); piecesRef.current = np;

    setFresh(placed);
    setTimeout(() => setFresh(new Set()), 180);

    const { rows, cols } = fullLines(nb);
    const lines = rows.length + cols.length;
    if (lines > 0) comboThisTurnRef.current = true;

    gridRef.current = nb;
    setBoard(nb);

    if (lines === 0) {
      bumpScore(shape.length);
      if (np.every((p) => p === null) && !comboThisTurnRef.current) {
        setStreak(0); streakRef.current = 0;
        finalize(nb);
      } else if (np.every((p) => p === null)) {
        finalize(nb);
      } else {
        // check if remaining pieces fit anywhere
        const remaining = np.filter(Boolean);
        if (!remaining.some((p) => getPlacements(nb, p.shape).length > 0)) {
          setOver(true);
        }
      }
      return;
    }

    const clearSet = new Set();
    rows.forEach((rr) => { for (let cc = 0; cc < SIZE; cc++) clearSet.add(`${rr}-${cc}`); });
    cols.forEach((cc) => { for (let rr = 0; rr < SIZE; rr++) clearSet.add(`${rr}-${cc}`); });

    setClearing(clearSet);
    setAnim(true);

    setTimeout(() => {
      const cb = cloneBoard(nb);
      clearSet.forEach((k) => { const [a, b] = k.split("-").map(Number); cb[a][b] = null; });
      gridRef.current = cb; setBoard(cb);
      setClearing(new Set());

      const comboBonus = (10 * lines * (lines + 1)) / 2;
      const mult = 1 + Math.max(0, streakRef.current) * 0.5;
      const total = Math.round((shape.length + comboBonus) * mult);

      bumpScore(total);
      const sub = lines >= 2 ? `COMBO ×${lines}` : streakRef.current >= 2 ? `STREAK ${streakRef.current}` : "";
      pushFloat(`+${total}`, sub);
      

      setAnim(false);

      if (np.every((p) => p === null)) {
        if (comboThisTurnRef.current) {
          const ns = streakRef.current + 1;
          setStreak(ns); streakRef.current = ns;
        } else {
          setStreak(0); streakRef.current = 0;
        }
        finalize(cb);
      } else {
        const remaining = np.filter(Boolean);
        if (!remaining.some((p) => getPlacements(cb, p.shape).length > 0)) {
          setOver(true);
        }
      }
    }, 220);
  }, [bumpScore, finalize, pushFloat]);

  // drag listeners
  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      if (e.cancelable) e.preventDefault();
      const d = dragRef.current; if (!d) return;
      const rect = boardRef.current.getBoundingClientRect();
      const cell = rect.width / SIZE;
      const sw = shapeW(d.shape), sh = shapeH(d.shape);
      const lift = cell * 0.7 + 22;
      const vLeft = e.clientX - (sw * cell) / 2;
      const vTop = e.clientY - (sh * cell) / 2 - lift;
      const oc = Math.round((vLeft - rect.left) / cell);
      const orr = Math.round((vTop - rect.top) / cell);
      const valid = canPlace(gridRef.current, d.shape, orr, oc);
      setDrag((p) => (p ? { ...p, px: e.clientX, py: e.clientY, ghostR: orr, ghostC: oc, ghostValid: valid, cell } : p));
    };
    const up = () => {
      const d = dragRef.current;
      if (d && d.ghostValid) applyPlacement(d.pieceIdx, d.shape, d.color, d.ghostR, d.ghostC);
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [!!drag, applyPlacement]);

  const startDrag = (e, idx) => {
    if (animRef.current || over) return;
    const p = pieces[idx]; if (!p) return;
    if (e.cancelable) e.preventDefault();
    const rect = boardRef.current.getBoundingClientRect();
    setDrag({
      pieceIdx: idx, shape: p.shape, color: p.color,
      px: e.clientX, py: e.clientY,
      ghostR: null, ghostC: null, ghostValid: false, cell: rect.width / SIZE,
    });
  };

  const restart = () => {
    const eb = emptyBoard();
    setBoard(eb); gridRef.current = eb;
    const t = generateFairThree(eb, 0); setPieces(t); piecesRef.current = t;
    setScore(0); setStreak(0); streakRef.current = 0;
    setClearing(new Set()); setFresh(new Set()); setFloats([]);
    setAnim(false); setOver(false); comboThisTurnRef.current = false;
  };

  // ghost overlay map
  const ghost = {};
  if (drag && drag.ghostR != null) {
    for (const [dr, dc] of drag.shape) {
      const rr = drag.ghostR + dr, cc = drag.ghostC + dc;
      if (rr >= 0 && cc >= 0 && rr < SIZE && cc < SIZE) ghost[`${rr}-${cc}`] = drag.ghostValid;
    }
  }

  const streakPct = Math.min(100, streak * 16.6);

  return (
    <div className="bb-root">
      <style>{CSS}</style>
      <div className="bb-wrap">
        <header className="bb-head">
          <div className="bb-stat">
            <span className="bb-lab">SKOR</span>
            <span className="bb-score">{score.toLocaleString("tr-TR")}</span>
          </div>
          <div className="bb-title">BLOCK<span>BLAST</span></div>
          <div className="bb-stat bb-right">
            <span className="bb-lab">REKOR</span>
            <span className="bb-best">{best.toLocaleString("tr-TR")}</span>
          </div>
        </header>

        <div className="bb-streakbar">
          <div className="bb-streaktext">{streak >= 2 ? `🔥 STREAK ${streak}` : "STREAK"}</div>
          <div className="bb-streaktrack"><div className="bb-streakfill" style={{ width: `${streakPct}%` }} /></div>
        </div>

        <div className="bb-boardwrap">
          <div className="bb-board" ref={boardRef} style={{ touchAction: "none" }}>
            {board.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                const g = key in ghost;
                return (
                  <div key={key} className="bb-cell">
                    <div className="bb-slot" />
                    {cell && (
                      <div
                        className={`bb-block ${clearing.has(key) ? "bb-clear" : ""} ${fresh.has(key) ? "bb-pop" : ""}`}
                        style={{ ...blockStyle(cell), animationDelay: clearing.has(key) ? `${(r + c) * 14}ms` : "0ms" }}
                      />
                    )}
                    {g && !cell && (
                      <div className="bb-ghost" style={ghost[key]
                        ? { ...blockStyle(drag.color), opacity: 0.5 }
                        : { background: "rgba(255,70,90,.32)", boxShadow: "inset 0 0 0 2px rgba(255,90,110,.7)" }} />
                    )}
                  </div>
                );
              })
            )}

            {floats.map((f) => (
              <div key={f.id} className="bb-float">
                <div className="bb-float-main">{f.text}</div>
                {f.sub && <div className="bb-float-sub">{f.sub}</div>}
              </div>
            ))}

            {over && (
              <div className="bb-over">
                <div className="bb-over-title">Oyun Bitti</div>
                <div className="bb-over-score">{score.toLocaleString("tr-TR")} puan</div>
                {score >= best && score > 0 && <div className="bb-over-new">🏆 Yeni rekor!</div>}
                <button className="bb-btn" onClick={restart}>Tekrar Oyna</button>
              </div>
            )}
          </div>
        </div>

        <div className="bb-tray">
          {pieces.map((p, i) => {
            const dragging = drag && drag.pieceIdx === i;
            return (
              <div key={i} className="bb-tray-slot">
                {p && !dragging && (
                  <div
                    className="bb-tray-piece"
                    style={{
                      gridTemplateColumns: `repeat(${shapeW(p.shape)}, var(--tc))`,
                      gridTemplateRows: `repeat(${shapeH(p.shape)}, var(--tc))`,
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => startDrag(e, i)}
                  >
                    {Array.from({ length: shapeH(p.shape) }).map((_, rr) =>
                      Array.from({ length: shapeW(p.shape) }).map((__, cc) => {
                        const on = p.shape.some(([a, b]) => a === rr && b === cc);
                        return on
                          ? <div key={`${rr}-${cc}`} className="bb-tblock" style={blockStyle(p.color)} />
                          : <div key={`${rr}-${cc}`} />;
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="bb-reset" onClick={restart}>↻ Yeniden Başlat</button>
      </div>

      {drag && (() => {
        const sw = shapeW(drag.shape), sh = shapeH(drag.shape);
        const cell = drag.cell, lift = cell * 0.7 + 22;
        return (
          <div
            className="bb-dragvisual"
            style={{
              left: drag.px - (sw * cell) / 2,
              top: drag.py - (sh * cell) / 2 - lift,
              width: sw * cell, height: sh * cell,
            }}
          >
            {drag.shape.map(([a, b], k) => (
              <div key={k} className="bb-block bb-dblock"
                style={{ ...blockStyle(drag.color), left: b * cell, top: a * cell, width: cell, height: cell }} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

/* ============================ Styles ============================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Outfit:wght@500;600;700&display=swap');

.bb-root{
  --tc: clamp(20px, 6.4vw, 30px);
  min-height:100vh; width:100%;
  display:flex; align-items:center; justify-content:center;
  font-family:'Outfit',sans-serif;
  background:
    radial-gradient(1200px 700px at 18% -10%, #2a3566 0%, transparent 55%),
    radial-gradient(900px 600px at 95% 110%, #3a2150 0%, transparent 55%),
    linear-gradient(160deg, #11152b, #0a0c1a 60%, #0d0a1c);
  color:#fff; padding:18px 14px; overflow:hidden;
}
.bb-wrap{ width:min(94vw, 460px); display:flex; flex-direction:column; gap:14px; }

.bb-head{ display:flex; align-items:flex-end; justify-content:space-between; }
.bb-stat{ display:flex; flex-direction:column; min-width:90px; }
.bb-right{ align-items:flex-end; }
.bb-lab{ font-size:11px; letter-spacing:2px; color:#7e86b5; font-weight:700; }
.bb-score{ font-family:'Fredoka'; font-weight:700; font-size:30px; line-height:1; color:#ffe79b; text-shadow:0 2px 0 rgba(0,0,0,.35); }
.bb-best{ font-family:'Fredoka'; font-weight:700; font-size:22px; line-height:1; color:#9fb4ff; }
.bb-title{ font-family:'Fredoka'; font-weight:700; font-size:20px; letter-spacing:1px; text-align:center; color:#fff; }
.bb-title span{ display:block; font-size:14px; letter-spacing:5px; color:#62e0c8; }

.bb-streakbar{ display:flex; align-items:center; gap:10px; }
.bb-streaktext{ font-family:'Fredoka'; font-size:12px; letter-spacing:1px; color:#ff9d5c; min-width:96px; }
.bb-streaktrack{ flex:1; height:7px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
.bb-streakfill{ height:100%; border-radius:99px; background:linear-gradient(90deg,#ffd23f,#ff7849,#ff4d6d); transition:width .4s cubic-bezier(.2,.8,.2,1); }

.bb-boardwrap{ position:relative; }
.bb-board{
  position:relative;
  display:grid; grid-template-columns:repeat(8,1fr); grid-template-rows:repeat(8,1fr);
  aspect-ratio:1/1; width:100%;
  padding:10px; gap:3px; border-radius:24px;
  background:linear-gradient(160deg,#1b2142,#141832);
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.06), 0 20px 60px rgba(0,0,0,.55), 0 0 80px rgba(56,189,248,.08);
  user-select:none;
}
.bb-cell{ position:relative; border-radius:18%; overflow:hidden; }
.bb-slot{ position:absolute; inset:8%; border-radius:22%; background:rgba(255,255,255,.04); box-shadow:inset 0 1px 3px rgba(0,0,0,.4), inset 0 -1px 1px rgba(255,255,255,.03); }
.bb-block{ position:absolute; inset:5%; border-radius:22%; }
.bb-pop{ animation:bb-pop .24s cubic-bezier(.34,1.56,.64,1) both; }
.bb-clear{ animation:bb-clear .50s cubic-bezier(.33,1,.68,1) forwards; }
.bb-ghost{ position:absolute; inset:5%; border-radius:22%; }

.bb-dragvisual{ position:fixed; pointer-events:none; z-index:50; filter:drop-shadow(0 14px 18px rgba(0,0,0,.55)) brightness(1.1); }
.bb-dblock{ position:absolute; inset:auto; border-radius:22%; transform:scale(1.04); }

.bb-tray{ display:flex; justify-content:space-around; align-items:center; gap:8px;
  min-height:calc(var(--tc)*3.4); padding:12px 8px; border-radius:20px;
  background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.025)); }
.bb-tray-slot{ flex:1; display:flex; align-items:center; justify-content:center; min-height:calc(var(--tc)*3); }
.bb-tray-piece{ display:grid; gap:3px; cursor:grab; animation:bb-trayin .3s cubic-bezier(.34,1.56,.64,1) both; }
.bb-tray-piece:active{ cursor:grabbing; }
.bb-tblock{ width:var(--tc); height:var(--tc); border-radius:22%; }

.bb-reset{ align-self:center; margin-top:2px; background:rgba(255,255,255,.08); color:#b8c0ea;
  border:none; padding:10px 22px; border-radius:99px; font-family:'Outfit'; font-weight:600; font-size:13px; cursor:pointer; transition:all .2s ease; }
.bb-reset:hover{ background:rgba(255,255,255,.15); color:#fff; transform:translateY(-1px); }

.bb-float{ position:absolute; left:50%; top:42%; transform:translateX(-50%); text-align:center; pointer-events:none; animation:bb-float .85s cubic-bezier(.25,.46,.45,.94) forwards; z-index:20; }
.bb-float-main{ font-family:'Fredoka'; font-weight:700; font-size:46px; color:#fff; text-shadow:0 0 28px rgba(255,210,80,.9), 0 4px 12px rgba(0,0,0,.45); }
.bb-float-sub{ font-family:'Fredoka'; font-size:16px; letter-spacing:1.5px; color:#ffd23f; text-shadow:0 0 12px rgba(255,210,80,.7); margin-top:2px; }

.bb-over{ position:absolute; inset:0; border-radius:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  background:rgba(8,10,22,.85); backdrop-filter:blur(6px); z-index:30; animation:bb-fade .3s ease; }
.bb-over-title{ font-family:'Fredoka'; font-weight:700; font-size:36px; color:#ff6b8a; text-shadow:0 0 24px rgba(255,107,138,.4); }
.bb-over-score{ font-family:'Fredoka'; font-size:24px; color:#ffe79b; }
.bb-over-new{ font-size:15px; color:#62e0c8; font-weight:600; }
.bb-btn{ margin-top:10px; background:linear-gradient(135deg,#ffd23f,#ff7849); color:#221a05; border:none;
  padding:14px 32px; border-radius:99px; font-family:'Fredoka'; font-weight:700; font-size:18px; cursor:pointer;
  box-shadow:0 10px 28px rgba(255,120,73,.45); transition:transform .15s ease, box-shadow .15s ease; }
.bb-btn:hover{ transform:translateY(-2px); box-shadow:0 14px 34px rgba(255,120,73,.55); }
.bb-btn:active{ transform:translateY(1px); }

@keyframes bb-pop{ 0%{transform:scale(.35);opacity:0} 55%{transform:scale(1.14)} 80%{transform:scale(.97)} 100%{transform:scale(1);opacity:1} }
@keyframes bb-clear{ 0%{transform:scale(1);filter:brightness(1)} 35%{transform:scale(1.22);filter:brightness(2.6)} 65%{transform:scale(.90);filter:brightness(1.5);opacity:.75} 100%{transform:scale(0);opacity:0;filter:brightness(2)} }
@keyframes bb-float{ 0%{opacity:0;transform:translateX(-50%) translateY(8px) scale(.6)} 18%{opacity:1;transform:translateX(-50%) translateY(-8px) scale(1.12)} 100%{opacity:0;transform:translateX(-50%) translateY(-90px) scale(1)} }
@keyframes bb-trayin{ 0%{transform:scale(.55) translateY(10px);opacity:0} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes bb-fade{ from{opacity:0} to{opacity:1} }
`;
