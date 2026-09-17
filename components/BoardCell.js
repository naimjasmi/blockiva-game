import PlayerPiece from "./PlayerPiece";

export default function BoardCell({
  row,
  col,
  occupant,
  isValidMove,
  turn,
  onClick,
}) {
  const isTopGoal = row === 0;
  const isBottomGoal = row === 8;

  let cellColor = "bg-board-cell";

  if (isValidMove) {
    cellColor =
      turn === 1
        ? "bg-orange-500/30"
        : "bg-blue-500/30";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`aspect-square w-full rounded-md transition ${cellColor} ${
        isTopGoal
          ? "border-t-2 border-blue-500/40"
          : isBottomGoal
            ? "border-b-2 border-orange-500/40"
            : ""
      }`}
    >
      {occupant && (
        <PlayerPiece player={occupant} />
      )}
    </button>
  );
}