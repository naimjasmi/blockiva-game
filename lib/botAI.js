import {
  getValidMoves,
  isValidWallPlacement,
  shortestPathLength,
  BOARD_SIZE,
} from "@/lib/gameLogic";

/*
 * Bot is always Player 2 (goal = bottom row, BOARD_SIZE - 1).
 * Human is Player 1 (goal = top row, 0).
 *
 * Difficulty:
 *  - easy:   often moves randomly, rarely uses walls
 *  - normal: greedy, picks the best move/wall by distance gain
 *  - hard:   greedy + looks one reply ahead
 */
const BOT_GOAL = BOARD_SIZE - 1;
const HUMAN_GOAL = 0;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getAllWallCandidates(walls, botPos, humanPos) {
  const out = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const orientation of ["horizontal", "vertical"]) {
        if (
          isValidWallPlacement(
            walls,
            row,
            col,
            orientation,
            humanPos,
            botPos
          )
        ) {
          out.push({ row, col, orientation });
        }
      }
    }
  }

  return out;
}

/* Positive = good for the bot. */
function evaluate(botPos, humanPos, walls) {
  return (
    shortestPathLength(humanPos, HUMAN_GOAL, walls) -
    shortestPathLength(botPos, BOT_GOAL, walls)
  );
}

/*
 * Best score the human can force on their reply (moves only,
 * plus walls limited to those that hurt the bot most).
 */
function worstCaseAfterReply(botPos, humanPos, walls, humanWallsLeft) {
  let worst = Infinity;

  for (const m of getValidMoves(humanPos, botPos, walls)) {
    worst = Math.min(worst, evaluate(botPos, m, walls));
  }

  if (humanWallsLeft > 0) {
    for (const w of getAllWallCandidates(walls, botPos, humanPos)) {
      worst = Math.min(
        worst,
        evaluate(botPos, humanPos, [...walls, w])
      );
    }
  }

  return worst === Infinity
    ? evaluate(botPos, humanPos, walls)
    : worst;
}

/*
 * Returns { type: "move", row, col } or
 *         { type: "wall", row, col, orientation } or null
 */
export function chooseBotAction({
  botPos,
  humanPos,
  walls,
  botWalls,
  humanWalls,
  difficulty = "normal",
}) {
  const moves = getValidMoves(botPos, humanPos, walls);

  const candidates = [];

  for (const m of moves) {
    candidates.push({
      action: { type: "move", row: m.row, col: m.col },
      score: evaluate(m, humanPos, walls),
      nextBot: m,
      nextHuman: humanPos,
      nextWalls: walls,
    });
  }

  if (botWalls > 0) {
    for (const w of getAllWallCandidates(walls, botPos, humanPos)) {
      const newWalls = [...walls, { ...w, player: 2 }];

      candidates.push({
        action: { type: "wall", ...w },
        // Tiny penalty so the bot doesn't waste walls for no gain
        score: evaluate(botPos, humanPos, newWalls) - 0.5,
        nextBot: botPos,
        nextHuman: humanPos,
        nextWalls: newWalls,
      });
    }
  }

  if (candidates.length === 0) return null;

  if (difficulty === "easy") {
    const moveOnly = candidates.filter((c) => c.action.type === "move");
    const roll = Math.random();

    if (roll < 0.4 && moveOnly.length) {
      return pick(moveOnly).action;
    }

    // Otherwise take the best plain move (rarely a wall)
    if (roll < 0.9 && moveOnly.length) {
      return moveOnly.sort((a, b) => b.score - a.score)[0].action;
    }
  }

  if (difficulty === "hard") {
    // Shortlist top 12, then look at the human's best reply
    candidates.sort((a, b) => b.score - a.score);

    const shortlist = candidates.slice(0, 12);

    for (const c of shortlist) {
      c.score =
        worstCaseAfterReply(
          c.nextBot,
          c.nextHuman,
          c.nextWalls,
          humanWalls
        ) + (c.action.type === "wall" ? -0.5 : 0);
    }

    const best = Math.max(...shortlist.map((c) => c.score));

    return pick(
      shortlist.filter((c) => c.score === best)
    ).action;
  }

  // normal (and fallback)
  const best = Math.max(...candidates.map((c) => c.score));

  const top = candidates.filter((c) => c.score === best);

  // Prefer moving when tied
  const topMoves = top.filter((c) => c.action.type === "move");

  return pick(topMoves.length ? topMoves : top).action;
}