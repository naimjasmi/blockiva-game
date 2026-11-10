import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import GameHeader from "@/components/GameHeader";
import GameBoard from "@/components/GameBoard";
import ScoreBoard from "@/components/ScoreBoard";
import {
    isValidMove,
    isValidWallPlacement,
    getValidMoves,
} from "@/lib/gameLogic";
import { chooseBotAction } from "@/lib/botAI";
import HowToPlay from "@/components/HowToPlay";

const PLAYER_1_START = { row: 8, col: 4 };
const PLAYER_2_START = { row: 0, col: 4 };
const HUMAN = 1;
const BOT = 2;

export default function BotGame() {
    const router = useRouter();

    const difficulty = ["easy", "normal", "hard"].includes(
        router.query.level
    )
        ? router.query.level
        : "normal";

    const [player1Pos, setPlayer1Pos] = useState(PLAYER_1_START);
    const [player2Pos, setPlayer2Pos] = useState(PLAYER_2_START);
    const [turn, setTurn] = useState(HUMAN);
    const [walls, setWalls] = useState([]);
    const [player1Walls, setPlayer1Walls] = useState(10);
    const [player2Walls, setPlayer2Walls] = useState(10);
    const [winner, setWinner] = useState(null);
    const [forfeited, setForfeited] = useState(false);
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [showHelp, setShowHelp] = useState(false);

    const botTimer = useRef(null);

    /*
     * Bot takes its turn after a short "thinking" delay.
     */
    useEffect(() => {
        if (!router.isReady || winner || turn !== BOT) return;

        botTimer.current = setTimeout(() => {
            const action = chooseBotAction({
                botPos: player2Pos,
                humanPos: player1Pos,
                walls,
                botWalls: player2Walls,
                humanWalls: player1Walls,
                difficulty,
            });

            if (!action) {
                setTurn(HUMAN);
                return;
            }

            if (action.type === "move") {
                const pos = { row: action.row, col: action.col };

                setPlayer2Pos(pos);

                if (pos.row === 8) {
                    setWinner(BOT);
                    setPlayer2Score((s) => s + 1);
                } else {
                    setTurn(HUMAN);
                }
            } else {
                setWalls((w) => [
                    ...w,
                    {
                        row: action.row,
                        col: action.col,
                        orientation: action.orientation,
                        player: BOT,
                    },
                ]);
                setPlayer2Walls((n) => n - 1);
                setTurn(HUMAN);
            }
        }, 700);

        return () => clearTimeout(botTimer.current);
    }, [
        router.isReady,
        turn,
        winner,
        player1Pos,
        player2Pos,
        walls,
        player1Walls,
        player2Walls,
        difficulty,
    ]);

    const validMoves =
        winner || turn !== HUMAN
            ? []
            : getValidMoves(player1Pos, player2Pos, walls);

    function isHighlightedCell(row, col) {
        return validMoves.some(
            (m) => m.row === row && m.col === col
        );
    }

    function handleCellClick(row, col) {
        if (winner || turn !== HUMAN) return;

        const target = { row, col };

        if (!isValidMove(player1Pos, player2Pos, target, walls)) {
            return;
        }

        setPlayer1Pos(target);

        if (target.row === 0) {
            setWinner(HUMAN);
            setPlayer1Score((s) => s + 1);
        } else {
            setTurn(BOT);
        }
    }

    function handleWallPlacement(row, col, orientation) {
        if (winner || turn !== HUMAN) return;
        if (player1Walls <= 0) return;

        if (
            !isValidWallPlacement(
                walls,
                row,
                col,
                orientation,
                player1Pos,
                player2Pos
            )
        ) {
            return;
        }

        setWalls([...walls, { row, col, orientation, player: HUMAN }]);
        setPlayer1Walls(player1Walls - 1);
        setTurn(BOT);
    }

    function handleForfeit() {
        if (!window.confirm("Forfeit this round? The bot will win.")) {
            return;
        }

        clearTimeout(botTimer.current);
        setForfeited(true);
        setWinner(BOT);
        setPlayer2Score((s) => s + 1);
    }

    function handlePlayAgain() {
        setPlayer1Pos(PLAYER_1_START);
        setPlayer2Pos(PLAYER_2_START);
        setWalls([]);
        setPlayer1Walls(10);
        setPlayer2Walls(10);
        setWinner(null);
        setForfeited(false);
        setTurn(HUMAN);
    }

    return (
        <>
            <Head>
                <title>Blockiva — vs Bot</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                />
            </Head>

            <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
                <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-parchment/70 transition hover:bg-white/20"
                    aria-label="How to play"
                >
                    ?
                </button>

                <HowToPlay open={showHelp} onClose={() => setShowHelp(false)} />
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-parchment/40">
                    vs Bot · {difficulty}
                </p>

                <GameHeader
                    turn={turn}
                    player1Walls={player1Walls}
                    player2Walls={player2Walls}
                />

                <GameBoard
                    player1Pos={player1Pos}
                    player2Pos={player2Pos}
                    walls={walls}
                    turn={turn}
                    validMoves={validMoves}
                    isHighlightedCell={isHighlightedCell}
                    onCellClick={handleCellClick}
                    onWallPlacement={handleWallPlacement}
                />

                <div className="mt-6 h-[140px]">
                    {!winner && (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-xs text-parchment/50">
                                {turn === HUMAN ? "Your turn" : "Bot is thinking..."}
                            </p>

                            <div className="flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleForfeit}
                                    className="rounded-lg px-4 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
                                >
                                    Forfeit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.push("/")}
                                    className="rounded-lg px-4 py-2 text-sm text-parchment/50 transition hover:bg-white/5"
                                >
                                    Quit Game
                                </button>
                            </div>
                        </div>
                    )}

                    {winner && (
                        <div className="rounded-xl bg-board-panel px-6 py-4 text-center">
                            <div className="text-xl font-bold">
                                {winner === HUMAN ? "🏆 You Win!" : "🤖 Bot Wins!"}
                            </div>

                            <div className="mt-1 text-sm opacity-70">
                                {forfeited
                                    ? "You forfeited the round."
                                    : winner === HUMAN
                                        ? "You reached the goal."
                                        : "The bot reached the goal."}
                            </div>

                            <button
                                type="button"
                                onClick={handlePlayAgain}
                                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
                            >
                                Play Again
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push("/")}
                                className="mt-2 ml-2 rounded-lg px-4 py-2 text-sm text-parchment/50 transition hover:bg-white/5"
                            >
                                Quit Game
                            </button>
                        </div>
                    )}
                </div>
                <br />

                <ScoreBoard
                    player1Score={player1Score}
                    player2Score={player2Score}
                />
            </main>
        </>
    );
}