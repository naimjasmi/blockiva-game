export default function GameHeader({ turn, player1Walls, player2Walls }) {
  return (
    <div className="mx-auto mb-4 flex w-full max-w-md items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-p1" />
        <span className="text-parchment/70">Walls: {player1Walls}</span>
      </div>

      <div
        className={`rounded-full px-4 py-1.5 font-medium ${
          turn === 1 ? "bg-p1/20 text-p1" : "bg-p2/20 text-p2"
        }`}
      >
        {turn === 1 ? "Player 1's turn" : "Player 2's turn"}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-parchment/70">Walls: {player2Walls}</span>
        <span className="h-3 w-3 rounded-full bg-p2" />
      </div>
    </div>
  );
}
