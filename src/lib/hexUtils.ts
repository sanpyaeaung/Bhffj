export const R = 32;
export const W = Math.sqrt(3) * R;
export const H = 2 * R;

// Offset to center the board in the SVG (300x400)
export const DX = 39;
export const DY = 56;

export function getPixelCoords(q: number, r: number) {
  const x = W * (q + r / 2);
  const y = (H * 3 / 4) * r;
  return { x, y };
}

export function getAxialCoords(px: number, py: number) {
  const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / R;
  const r = (2 / 3 * py) / R;
  return axialRound(q, r);
}

function axialRound(x: number, y: number) {
  let q = Math.round(x);
  let r = Math.round(y);
  let s = Math.round(-x - y);

  const q_diff = Math.abs(q - x);
  const r_diff = Math.abs(r - y);
  const s_diff = Math.abs(s - (-x - y));

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  }
  return { q, r };
}

export type BoardState = Map<string, number | null>;

export function createInitialBoard(): BoardState {
  const board = new Map<string, number | null>();
  for (let row = 0; row < 7; row++) {
    const cols = row % 2 === 0 ? 5 : 4;
    for (let col = 0; col < cols; col++) {
      const q = col - Math.floor(row / 2);
      const r = row;
      board.set(`${q},${r}`, null);
    }
  }
  return board;
}

export function findConnected(board: BoardState, q: number, r: number, value: number) {
  const visited = new Set<string>();
  const component: { q: number, r: number }[] = [];
  const queue = [{ q, r }];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const key = `${curr.q},${curr.r}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (board.get(key) === value) {
      component.push(curr);

      const neighbors = [
        { q: curr.q + 1, r: curr.r }, { q: curr.q - 1, r: curr.r },
        { q: curr.q, r: curr.r + 1 }, { q: curr.q, r: curr.r - 1 },
        { q: curr.q + 1, r: curr.r - 1 }, { q: curr.q - 1, r: curr.r + 1 }
      ];

      for (const n of neighbors) {
        if (!visited.has(`${n.q},${n.r}`)) {
          queue.push(n);
        }
      }
    }
  }
  return component;
}

export function processMerges(initialBoard: BoardState, startCells: { q: number, r: number, value: number }[]) {
  let currentBoard = new Map(initialBoard);
  let queue = [...startCells];
  let scoreGained = 0;

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const val = currentBoard.get(`${cell.q},${cell.r}`);
    if (val === null || val === undefined) continue;

    const component = findConnected(currentBoard, cell.q, cell.r, val);

    if (component.length >= 2) {
      // Remove all merged blocks
      for (const c of component) {
        currentBoard.set(`${c.q},${c.r}`, null);
      }

      const newVal = val * 2;
      scoreGained += newVal;

      // Place new block
      currentBoard.set(`${cell.q},${cell.r}`, newVal);

      // Check for further merges
      queue.push({ q: cell.q, r: cell.r, value: newVal });
    }
  }

  return { newBoard: currentBoard, scoreGained };
}

export type PieceDef = {
  id: string;
  blocks: { dq: number, dr: number, value: number }[];
};

export function generatePiece(): PieceDef {
  const getRandomValue = () => {
    const r = Math.random();
    if (r < 0.4) return 2;
    if (r < 0.7) return 4;
    if (r < 0.9) return 8;
    if (r < 0.98) return 16;
    return 32;
  };

  const isDouble = Math.random() > 0.4;
  const blocks = [{ dq: 0, dr: 0, value: getRandomValue() }];

  if (isDouble) {
    const dirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    blocks.push({ dq: dir[0], dr: dir[1], value: getRandomValue() });
  }

  return { id: Math.random().toString(), blocks };
}

export function checkGameOver(board: BoardState, piece: PieceDef) {
  for (const [key, val] of board.entries()) {
    if (val === null) {
      const [qStr, rStr] = key.split(',');
      const q = parseInt(qStr);
      const r = parseInt(rStr);

      let canPlace = true;
      for (const block of piece.blocks) {
        const tq = q + block.dq;
        const tr = r + block.dr;
        const tKey = `${tq},${tr}`;
        if (!board.has(tKey) || board.get(tKey) !== null) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) return false;
    }
  }
  return true;
}
