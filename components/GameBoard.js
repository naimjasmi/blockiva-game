import { useEffect, useRef, useState } from "react";
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
  const [wallPreview, setWallPreview] = useState(null);

  const wallPressTimer = useRef(null);
  const wallInteractionRef = useRef(null);

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

  // =========================
  // FIND WALL UNDER FINGER
  // =========================

  const getWallFromPoint = (clientX, clientY) => {
    const element = document.elementFromPoint(
      clientX,
      clientY
    );

    if (!element) {
      return null;
    }

    const wallButton =
      element.closest("[data-wall-slot]");

    if (!wallButton) {
      return null;
    }

    const row = Number(
      wallButton.dataset.wallRow
    );

    const col = Number(
      wallButton.dataset.wallCol
    );

    const orientation =
      wallButton.dataset.wallOrientation;

    if (
      Number.isNaN(row) ||
      Number.isNaN(col) ||
      !orientation
    ) {
      return null;
    }

    return {
      row,
      col,
      orientation,
    };
  };

  // =========================
  // START WALL INTERACTION
  // =========================

  const handleWallPointerDown = (
    event,
    row,
    col,
    orientation
  ) => {
    event.preventDefault();

    if (wallInteractionRef.current) {
      return;
    }

    wallInteractionRef.current = {
      pointerId: event.pointerId,
      row,
      col,
      orientation,
      active: false,
    };

    wallPressTimer.current = setTimeout(() => {
      if (!wallInteractionRef.current) {
        return;
      }

      wallInteractionRef.current.active = true;

      setWallPreview({
        row,
        col,
        orientation,
      });
    }, 180);
  };

  // =========================
  // FOLLOW FINGER
  // =========================

  useEffect(() => {
    const handlePointerMove = (event) => {
      const interaction =
        wallInteractionRef.current;

      if (!interaction) {
        return;
      }

      if (
        event.pointerId !== interaction.pointerId
      ) {
        return;
      }

      if (interaction.active) {
        event.preventDefault();
      }

      if (!interaction.active) {
        return;
      }

      const wall = getWallFromPoint(
        event.clientX,
        event.clientY
      );

      if (!wall) {
        setWallPreview(null);
        return;
      }

      setWallPreview(wall);
    };

    const handlePointerUp = (event) => {
      const interaction =
        wallInteractionRef.current;

      if (!interaction) {
        return;
      }

      if (
        event.pointerId !== interaction.pointerId
      ) {
        return;
      }

      if (wallPressTimer.current) {
        clearTimeout(wallPressTimer.current);
        wallPressTimer.current = null;
      }

      if (interaction.active) {
        const wall = getWallFromPoint(
          event.clientX,
          event.clientY
        );

        if (wall) {
          onWallPlacement(
            wall.row,
            wall.col,
            wall.orientation
          );
        }
      }

      wallInteractionRef.current = null;
      setWallPreview(null);
    };

    const handlePointerCancel = (event) => {
      const interaction =
        wallInteractionRef.current;

      if (!interaction) {
        return;
      }

      if (
        event.pointerId !== interaction.pointerId
      ) {
        return;
      }

      if (wallPressTimer.current) {
        clearTimeout(wallPressTimer.current);
        wallPressTimer.current = null;
      }

      wallInteractionRef.current = null;
      setWallPreview(null);
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerCancel
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerCancel
      );
    };
  }, [onWallPlacement]);

  // =========================
  // CLEAN UP TIMER
  // =========================

  useEffect(() => {
    return () => {
      if (wallPressTimer.current) {
        clearTimeout(
          wallPressTimer.current
        );
      }
    };
  }, []);

  // =========================
  // BOARD GRID
  // =========================

  const gridStyle = {
    gridTemplateColumns:
      "repeat(8, minmax(0, 1fr) 6px) minmax(0, 1fr)",

    gridTemplateRows:
      "repeat(8, minmax(0, 1fr) 6px) minmax(0, 1fr)",
  };

  // =========================
  // WALL BUTTON STYLE
  // =========================

  const wallButtonClass =
    "group z-20 flex touch-none select-none items-center justify-center border-0 bg-transparent p-0 outline-none focus:outline-none focus:ring-0 active:bg-transparent [-webkit-tap-highlight-color:transparent]";

  return (
    <div
      className="
        mx-auto
        aspect-square
        w-full
        max-w-md
        select-none
        rounded-lg
        bg-board-panel
        p-2
      "
    >
      <div
        className="grid h-full w-full select-none"
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
                ${
                  row === 0
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
                occupant={occupantAt(
                  row,
                  col
                )}
                isValidMove={isHighlightedCell(
                  row,
                  col
                )}
                turn={turn}
                onClick={() =>
                  onCellClick(row, col)
                }
              />
            </div>
          ))
        )}

        {/* =========================
            HORIZONTAL WALLS
        ========================== */}

        {Array.from({ length: 8 }).map(
          (_, row) =>
            Array.from({ length: 8 }).map(
              (_, col) => {
                const wall =
                  getHorizontalWall(
                    row + 1,
                    col
                  );

                const isPreview =
                  wallPreview?.orientation ===
                    "horizontal" &&
                  wallPreview?.row ===
                    row + 1 &&
                  wallPreview?.col === col;

                return (
                  <button
                    key={`horizontal-${row}-${col}`}
                    type="button"
                    aria-label="Place horizontal wall"
                    data-wall-slot="true"
                    data-wall-row={
                      row + 1
                    }
                    data-wall-col={col}
                    data-wall-orientation="horizontal"
                    onPointerDown={(event) =>
                      handleWallPointerDown(
                        event,
                        row + 1,
                        col,
                        "horizontal"
                      )
                    }
                    className={wallButtonClass}
                    style={{
                      gridColumn: `${col * 2 + 1} / span 3`,
                      gridRow:
                        row * 2 + 2,
                    }}
                  >
                    <span
                      className={`
                        block w-full rounded-full
                        ${
                          wall
                            ? wall.player ===
                              1
                              ? "h-[6px] bg-orange-500"
                              : "h-[6px] bg-blue-500"
                            : isPreview
                              ? turn === 1
                                ? "h-[6px] bg-orange-500/70"
                                : "h-[6px] bg-blue-500/70"
                              : "h-[6px] bg-transparent group-hover:bg-black/40"
                        }
                      `}
                    />
                  </button>
                );
              }
            )
        )}

        {/* =========================
            VERTICAL WALLS
        ========================== */}

        {Array.from({ length: 8 }).map(
          (_, row) =>
            Array.from({ length: 8 }).map(
              (_, col) => {
                const wall =
                  getVerticalWall(
                    row,
                    col + 1
                  );

                const isPreview =
                  wallPreview?.orientation ===
                    "vertical" &&
                  wallPreview?.row === row &&
                  wallPreview?.col ===
                    col + 1;

                return (
                  <button
                    key={`vertical-${row}-${col}`}
                    type="button"
                    aria-label="Place vertical wall"
                    data-wall-slot="true"
                    data-wall-row={row}
                    data-wall-col={
                      col + 1
                    }
                    data-wall-orientation="vertical"
                    onPointerDown={(event) =>
                      handleWallPointerDown(
                        event,
                        row,
                        col + 1,
                        "vertical"
                      )
                    }
                    className={wallButtonClass}
                    style={{
                      gridColumn:
                        col * 2 + 2,
                      gridRow: `${row * 2 + 1} / span 3`,
                    }}
                  >
                    <span
                      className={`
                        block h-full rounded-full
                        ${
                          wall
                            ? wall.player ===
                              1
                              ? "w-[6px] bg-orange-500"
                              : "w-[6px] bg-blue-500"
                            : isPreview
                              ? turn === 1
                                ? "w-[6px] bg-orange-500/70"
                                : "w-[6px] bg-blue-500/70"
                              : "w-[6px] bg-transparent group-hover:bg-black/40"
                        }
                      `}
                    />
                  </button>
                );
              }
            )
        )}
      </div>
    </div>
  );
}