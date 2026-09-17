export default function ScoreBoard({ player1Score, player2Score }) {
  return (
    <div className="mx-auto mt-4 flex w-full max-w-md items-center justify-center gap-6 text-sm text-parchment/60">
      <span>
        Player 1 <span className="font-semibold text-p1">{player1Score}</span>
      </span>
      <span className="text-parchment/20">•</span>
      <span>
        Player 2 <span className="font-semibold text-p2">{player2Score}</span>
      </span>
    </div>
  );
}
