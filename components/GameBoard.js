import BoardCell from "./BoardCell";

export default function GameBoard({
  player1Pos,
  player2Pos,
  walls,
  turn,
  isHighlightedCell,
  onCellClick,
  onWallPlacement,
}) {
  const rows = Array.from({ length: 9 });
  const cols = Array.from({ length: 9 });

  const occupantAt = (row, col) => {
    if (
      player1Pos.row === row &&
      player1Pos.col === col
    ) {
      return 1;
    }

    if (
      player2Pos.row === row &&
      player2Pos.col === col
    ) {
      return 2;
    }

    return null;
  };

  const getHorizontalWall = (row, col) =>
    walls.find(
      (wall) =>
        wall.orientation === "horizontal" &&
        wall.row === row &&
        wall.col === col
    );

  const getVerticalWall = (row, col) =>
    walls.find(
      (wall) =>
        wall.orientation === "vertical" &&
        wall.row === row &&
        wall.col === col
    );

  /*
   * 17 × 17 layout:
   *
   * Cell | Gap | Cell | Gap | Cell ...
   *
   * 9 cell tracks
   * 8 gap tracks
   */
  const gridStyle = {
    gridTemplateColumns:
      "repeat(8, minmax(0, 1fr) 6px) minmax(0, 1fr)",
  
    gridTemplateRows:
      "repeat(8, minmax(0, 1fr) 6px) minmax(0, 1fr)",
  };

  return (
    <div className="mx-auto aspect-square w-full max-w-md rounded-lg bg-board-panel p-2">

      <div
        className="grid h-full w-full"
        style={gridStyle}
      >


        {/* =========================
            BOARD CELLS
        ========================== */}

        {rows.map((_, row) =>
          cols.map((_, col) => (
            <div
              key={`cell-${row}-${col}`}
              className={`
    rounded-md
    ${row === 0
                  ? "bg-blue-500/10"
                  : row === 8
                    ? "bg-orange-500/10"
                    : ""
                }
  `}
              style={{
                gridColumn: col * 2 + 1,
                gridRow: row * 2 + 1,
              }}
            >
              <BoardCell
                row={row}
                col={col}
                occupant={occupantAt(row, col)}
                isValidMove={isHighlightedCell(row, col)}
                turn={turn}
                onClick={() =>
                  onCellClick(row, col)
                }
              />
            </div>
          ))
        )}

        {/* =========================
            HORIZONTAL WALL SLOTS
        ========================== */}

        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const wall = getHorizontalWall(
              row + 1,
              col
            );

            return (
              <button
                key={`horizontal-${row}-${col}`}
                type="button"
                aria-label="Place horizontal wall"
                onClick={() =>
                  onWallPlacement(
                    row + 1,
                    col,
                    "horizontal"
                  )
                }
                className="group z-20 flex items-center justify-center border-0 bg-transparent p-0"
                style={{
                  gridColumn: `${col * 2 + 1} / span 3`,
                  gridRow: row * 2 + 2,
                }}
              >
                <span
                  className={`block w-full rounded-full transition ${wall
                      ? wall.player === 1
                        ? "h-[6px] bg-orange-500"
                        : "h-[6px] bg-blue-500"
                      : "h-[6px] bg-transparent group-hover:bg-black/40"
                    }`}
                />
              </button>
            );
          })
        )}

        {/* =========================
            VERTICAL WALL SLOTS
        ========================== */}

        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const wall = getVerticalWall(
              row,
              col + 1
            );

            return (
              <button
                key={`vertical-${row}-${col}`}
                type="button"
                aria-label="Place vertical wall"
                onClick={() =>
                  onWallPlacement(
                    row,
                    col + 1,
                    "vertical"
                  )
                }
                className="group z-20 flex items-center justify-center border-0 bg-transparent p-0"
                style={{
                  gridColumn: col * 2 + 2,
                  gridRow: `${row * 2 + 1} / span 3`,
                }}
              >
                <span
                  className={`block h-full rounded-full transition ${wall
                      ? wall.player === 1
                        ? "w-[6px] bg-orange-500"
                        : "w-[6px] bg-blue-500"
                      : "w-[6px] bg-transparent group-hover:bg-black/40"
                    }`}
                />
              </button>
            );
          })
        )}

      </div>
    </div>
  );
}