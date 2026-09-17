export default function PlayerPiece({ player }) {
  const color = player === 1 ? "bg-p1" : "bg-p2";
  return (
    <div className="flex h-full w-full items-center justify-center p-[12%]">
      <div className={`h-full w-full rounded-full ${color} shadow-[0_2px_4px_rgba(0,0,0,0.4)]`} />
    </div>
  );
}
