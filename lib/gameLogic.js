const BOARD_SIZE = 9;

function inBounds(pos) {
  return (
    pos.row >= 0 &&
    pos.row < BOARD_SIZE &&
    pos.col >= 0 &&
    pos.col < BOARD_SIZE
  );
}

function samePos(a, b) {
  return (
    a.row === b.row &&
    a.col === b.col
  );
}

const DIRECTIONS = [
  { dr: -1, dc: 0 }, // Up
  { dr: 1, dc: 0 },  // Down
  { dr: 0, dc: -1 }, // Left
  { dr: 0, dc: 1 },  // Right
];

/*
 * Check whether a wall blocks movement
 * between two adjacent cells.
 */
export function hasWallBetween(
  walls,
  from,
  to
) {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;

  /*
   * Vertical movement
   * is blocked by horizontal walls.
   */
  if (
    colDiff === 0 &&
    Math.abs(rowDiff) === 1
  ) {
    const wallRow =
      Math.max(
        from.row,
        to.row
      );

    return walls.some(
      (wall) =>
        wall.orientation ===
          "horizontal" &&
        wall.row === wallRow &&
        (
          wall.col === from.col ||
          wall.col === from.col - 1
        )
    );
  }

  /*
   * Horizontal movement
   * is blocked by vertical walls.
   */
  if (
    rowDiff === 0 &&
    Math.abs(colDiff) === 1
  ) {
    const wallCol =
      Math.max(
        from.col,
        to.col
      );

    return walls.some(
      (wall) =>
        wall.orientation ===
          "vertical" &&
        wall.col === wallCol &&
        (
          wall.row === from.row ||
          wall.row === from.row - 1
        )
    );
  }

  return false;
}

/*
 * Get all normal movement destinations.
 *
 * Used for:
 * - Player movement
 * - Path checking
 *
 * Players move one tile at a time.
 */
function getNormalMoves(
  position,
  walls
) {
  const moves = [];

  for (const { dr, dc } of DIRECTIONS) {
    const next = {
      row: position.row + dr,
      col: position.col + dc,
    };

    /*
     * Outside the board.
     */
    if (!inBounds(next)) {
      continue;
    }

    /*
     * Wall blocks movement.
     */
    if (
      hasWallBetween(
        walls,
        position,
        next
      )
    ) {
      continue;
    }

    moves.push(next);
  }

  return moves;
}

/*
 * Get all legal movement destinations.
 *
 * Rules:
 *
 * - Up / down / left / right only
 * - One tile at a time
 * - Cannot move outside the board
 * - Cannot move through a wall
 * - Cannot move onto the opponent
 * - NO jumping
 * - NO diagonal movement
 */
export function getValidMoves(
  current,
  opponent,
  walls = []
) {
  const moves = [];

  for (const { dr, dc } of DIRECTIONS) {
    const next = {
      row: current.row + dr,
      col: current.col + dc,
    };

    /*
     * Outside the board.
     */
    if (!inBounds(next)) {
      continue;
    }

    /*
     * Wall blocks movement.
     */
    if (
      hasWallBetween(
        walls,
        current,
        next
      )
    ) {
      continue;
    }

    /*
     * Opponent occupies the destination.
     *
     * No jumping or moving through
     * the opponent.
     */
    if (
      samePos(
        next,
        opponent
      )
    ) {
      continue;
    }

    moves.push(next);
  }

  return moves;
}

/*
 * Check whether a requested move is legal.
 */
export function isValidMove(
  current,
  opponent,
  target,
  walls = []
) {
  return getValidMoves(
    current,
    opponent,
    walls
  ).some(
    (move) =>
      samePos(
        move,
        target
      )
  );
}

/*
 * Check whether a player still has
 * at least one path to their goal.
 *
 * We use BFS (Breadth-First Search).
 *
 * Player 1 goal = top row
 * Player 2 goal = bottom row
 */
function hasPathToGoal(
  start,
  goalRow,
  walls
) {
  const queue = [start];

  const visited = new Set();

  const startKey =
    `${start.row}-${start.col}`;

  visited.add(startKey);

  while (
    queue.length > 0
  ) {
    const current =
      queue.shift();

    /*
     * Reached target row.
     */
    if (
      current.row ===
      goalRow
    ) {
      return true;
    }

    const moves =
      getNormalMoves(
        current,
        walls
      );

    for (
      const next of moves
    ) {
      const key =
        `${next.row}-${next.col}`;

      if (
        visited.has(key)
      ) {
        continue;
      }

      visited.add(key);

      queue.push(next);
    }
  }

  return false;
}

/*
 * Check whether BOTH players still
 * have a path to their goals.
 */
function bothPlayersHavePath(
  player1Pos,
  player2Pos,
  walls
) {
  const player1CanReachGoal =
    hasPathToGoal(
      player1Pos,
      0,
      walls
    );

  const player2CanReachGoal =
    hasPathToGoal(
      player2Pos,
      BOARD_SIZE - 1,
      walls
    );

  return (
    player1CanReachGoal &&
    player2CanReachGoal
  );
}

/*
 * Check whether a wall already exists.
 */
export function wallExists(
  walls,
  row,
  col,
  orientation
) {
  return walls.some(
    (wall) =>
      wall.row === row &&
      wall.col === col &&
      wall.orientation ===
        orientation
  );
}

/*
 * Validate wall placement.
 *
 * Checks:
 *
 * 1. Wall is inside the board
 * 2. Wall does not already exist
 * 3. Wall does not block Player 1
 * 4. Wall does not block Player 2
 */
export function isValidWallPlacement(
  walls,
  row,
  col,
  orientation,
  player1Pos,
  player2Pos
) {
  /*
   * Horizontal wall
   */
  if (
    orientation ===
    "horizontal"
  ) {
    /*
     * Horizontal walls exist
     * between rows 0-1 through 7-8.
     */
    if (
      row < 1 ||
      row > 8
    ) {
      return false;
    }

    /*
     * Wall spans two cells,
     * so starting column can
     * only be 0 through 7.
     */
    if (
      col < 0 ||
      col > 7
    ) {
      return false;
    }
  }

  /*
   * Vertical wall
   */
  if (
    orientation ===
    "vertical"
  ) {
    /*
     * Vertical walls exist
     * between columns 0-1 through 7-8.
     */
    if (
      row < 0 ||
      row > 7
    ) {
      return false;
    }

    /*
     * Wall spans two cells,
     * so starting row can
     * only be 0 through 7.
     */
    if (
      col < 1 ||
      col > 8
    ) {
      return false;
    }
  }

  /*
   * Check for duplicate wall.
   */
  if (
    wallExists(
      walls,
      row,
      col,
      orientation
    )
  ) {
    return false;
  }

  /*
   * Temporarily add the new wall.
   */
  const wallsAfterPlacement = [
    ...walls,
    {
      row,
      col,
      orientation,
    },
  ];

  /*
   * Both players must still have
   * a route to their goal.
   */
  if (
    !bothPlayersHavePath(
      player1Pos,
      player2Pos,
      wallsAfterPlacement
    )
  ) {
    return false;
  }

  return true;
}

export {
  BOARD_SIZE,
  samePos,
};