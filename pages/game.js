import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import GameHeader from "@/components/GameHeader";
import GameBoard from "@/components/GameBoard";
import ScoreBoard from "@/components/ScoreBoard";
import { supabase } from "@/lib/supabase";
import { getPlayerSessionId } from "@/lib/playerSession";
import {
  isValidMove,
  isValidWallPlacement,
  getValidMoves,
} from "@/lib/gameLogic";

const PLAYER_1_START = { row: 8, col: 4 };
const PLAYER_2_START = { row: 0, col: 4 };

export default function Game() {
  const router = useRouter();
  const [player1Pos, setPlayer1Pos] = useState(PLAYER_1_START);
  const [player2Pos, setPlayer2Pos] = useState(PLAYER_2_START);

  // 1 = Player 1
  // 2 = Player 2
  const [turn, setTurn] = useState(1);

  const [walls, setWalls] = useState([]);

  const [player1Walls, setPlayer1Walls] = useState(10);
  const [player2Walls, setPlayer2Walls] = useState(10);

  const [winner, setWinner] = useState(null);
  const [forfeitedBy, setForfeitedBy] = useState(null);
  const [gameAbandoned, setGameAbandoned] = useState(false);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
   * Get legal moves for the current player.
   */

  useEffect(() => {
    if (!router.isReady) return;

    const roomCode = router.query.room;

    if (!roomCode) return;

    async function loadGame() {
      const roomCode = router.query.room;

      console.log("Loading room:", roomCode);

      const { data: room, error } = await supabase.rpc(
        "get_room",
        {
          code: roomCode,
        }
      );

      console.log("Loaded room:", room);
      console.log("Load error:", error);

      if (error) {
        console.error("Load game error:", error);
        setLoading(false);
        return;
      }

      if (!room) {
        console.error("Game not found.");
        setLoading(false);
        return;
      }

      if (room.status === "abandoned") {
        setGameAbandoned(true);
        setLoading(false);
        return;
      }

      if (!room.game_state) {
        console.error("Game has no game state.");
        setLoading(false);
        return;
      }

      const sessionId = getPlayerSessionId();

      console.log("My session:", sessionId);
      console.log("Player 1 session:", room.player1_session_id);
      console.log("Player 2 session:", room.player2_session_id);

      if (room.player1_session_id === sessionId) {
        setCurrentPlayer(1);
      } else if (room.player2_session_id === sessionId) {
        setCurrentPlayer(2);
      } else {
        setCurrentPlayer(null);
      }

      const state = room.game_state;

      setPlayer1Pos(state.player1Pos);
      setPlayer2Pos(state.player2Pos);
      setTurn(state.turn);
      setWalls(state.walls);
      setPlayer1Walls(state.player1Walls);
      setPlayer2Walls(state.player2Walls);
      setWinner(state.winner);
      setForfeitedBy(state.forfeitedBy || null);
      setPlayer1Score(state.player1Score);
      setPlayer2Score(state.player2Score);
      setPlayer1Ready(state.player1Ready || false);
      setPlayer2Ready(state.player2Ready || false);

      setLoading(false);
    }

    loadGame();
  }, [router.isReady, router.query.room]);

  useEffect(() => {
    if (!router.isReady) return;

    const roomCode = router.query.room;
    if (!roomCode) return;

    const channel = supabase
      .channel(`room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          // Opponent quit the game
          if (payload.new.status === "abandoned") {
            setGameAbandoned(true);
            return;
          }

          const state = payload.new.game_state;

          if (!state) return;

          setPlayer1Pos(state.player1Pos);
          setPlayer2Pos(state.player2Pos);
          setTurn(state.turn);
          setWalls(state.walls);
          setPlayer1Walls(state.player1Walls);
          setPlayer2Walls(state.player2Walls);
          setWinner(state.winner);
          setForfeitedBy(state.forfeitedBy || null);
          setPlayer1Score(state.player1Score);
          setPlayer2Score(state.player2Score);
          setPlayer1Ready(state.player1Ready || false);
          setPlayer2Ready(state.player2Ready || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router.isReady, router.query.room]);

  async function saveGameState(newState) {
    const roomCode = router.query.room;

    if (!roomCode) return;

    const sessionId = getPlayerSessionId();

    const { data, error } = await supabase.rpc(
      "update_game_state",
      {
        code: roomCode,
        session_id: sessionId,
        new_state: newState,
      }
    );

    if (error) {
      console.error("Save game state error:", error);
      return;
    }

    console.log("Game state saved:", data);
  }
  async function handleForfeitGame() {
    const roomCode = router.query.room;

    if (!roomCode || !currentPlayer) return;

    const confirmed = window.confirm(
      "Are you sure you want to forfeit? Your opponent will win the game."
    );

    if (!confirmed) return;

    const sessionId = getPlayerSessionId();

    const { error } = await supabase.rpc("forfeit_game", {
      code: roomCode,
      session_id: sessionId,
    });

    if (error) {
      console.error("Forfeit game error:", error);
      return;
    }
  }

  async function handleQuitGame() {
    const roomCode = router.query.room;

    if (!roomCode || !currentPlayer) return;

    const confirmed = window.confirm(
      "Are you sure you want to quit this game?"
    );

    if (!confirmed) return;

    const sessionId = getPlayerSessionId();

    const { error } = await supabase.rpc("quit_game", {
      code: roomCode,
      session_id: sessionId,
    });

    if (error) {
      console.error("Quit game error:", error);
      return;
    }

    router.push("/");
  }

  const validMoves =
    winner || turn !== currentPlayer
      ? []
      : turn === 1
        ? getValidMoves(player1Pos, player2Pos, walls)
        : getValidMoves(player2Pos, player1Pos, walls);

  function isHighlightedCell(row, col) {
    return validMoves.some(
      (move) =>
        move.row === row &&
        move.col === col
    );
  }

  async function handlePlayAgain() {
    if (!currentPlayer) {
      return;
    }

    const newPlayer1Ready =
      currentPlayer === 1 ? true : player1Ready;

    const newPlayer2Ready =
      currentPlayer === 2 ? true : player2Ready;

    // If both players are ready, start a new round
    if (newPlayer1Ready && newPlayer2Ready) {
      const newState = {
        player1Pos: PLAYER_1_START,
        player2Pos: PLAYER_2_START,
        turn: 1,
        walls: [],
        player1Walls: 10,
        player2Walls: 10,
        winner: null,
        player1Score,
        player2Score,
        player1Ready: false,
        player2Ready: false,
      };

      setPlayer1Pos(PLAYER_1_START);
      setPlayer2Pos(PLAYER_2_START);
      setWalls([]);
      setPlayer1Walls(10);
      setPlayer2Walls(10);
      setTurn(1);
      setWinner(null);
      setPlayer1Ready(false);
      setPlayer2Ready(false);

      await saveGameState(newState);

      return;
    }

    // Only mark this player as ready
    const newState = {
      player1Pos,
      player2Pos,
      turn,
      walls,
      player1Walls,
      player2Walls,
      winner,
      player1Score,
      player2Score,
      player1Ready: newPlayer1Ready,
      player2Ready: newPlayer2Ready,
    };

    setPlayer1Ready(newPlayer1Ready);
    setPlayer2Ready(newPlayer2Ready);

    await saveGameState(newState);
  }

  /*
   * Moving is one complete turn.
   */
  async function handleCellClick(row, col) {
    // Game already finished
    if (winner) {
      return;
    }

    // Browser is not assigned to a player
    if (!currentPlayer) {
      return;
    }

    // Not this browser's turn
    if (turn !== currentPlayer) {
      return;
    }

    const clickedPosition = { row, col };

    if (turn === 1) {
      if (
        !isValidMove(
          player1Pos,
          player2Pos,
          clickedPosition,
          walls
        )
      ) {
        return;
      }

      const newWinner =
        clickedPosition.row === 0 ? 1 : null;

      const newTurn = newWinner ? 1 : 2;

      const newPlayer1Score =
        newWinner === 1
          ? player1Score + 1
          : player1Score;

      const newState = {
        player1Pos: clickedPosition,
        player2Pos,
        turn: newTurn,
        walls,
        player1Walls,
        player2Walls,
        winner: newWinner,
        player1Score: newPlayer1Score,
        player2Score,
      };

      // Update local UI immediately
      setPlayer1Pos(clickedPosition);
      setWinner(newWinner);
      setPlayer1Score(newPlayer1Score);
      setTurn(newTurn);

      // Save to Supabase
      await saveGameState(newState);

      return;
    }

    if (turn === 2) {
      if (
        !isValidMove(
          player2Pos,
          player1Pos,
          clickedPosition,
          walls
        )
      ) {
        return;
      }

      const newWinner =
        clickedPosition.row === 8 ? 2 : null;

      const newTurn = newWinner ? 2 : 1;

      const newPlayer2Score =
        newWinner === 2
          ? player2Score + 1
          : player2Score;

      const newState = {
        player1Pos,
        player2Pos: clickedPosition,
        turn: newTurn,
        walls,
        player1Walls,
        player2Walls,
        winner: newWinner,
        player1Score,
        player2Score: newPlayer2Score,
      };

      // Update local UI immediately
      setPlayer2Pos(clickedPosition);
      setWinner(newWinner);
      setPlayer2Score(newPlayer2Score);
      setTurn(newTurn);

      // Save to Supabase
      await saveGameState(newState);
    }
  }

  /*
   * Placing a wall is also one complete turn.
   *
   * Orientation is automatically determined by
   * which wall slot the player clicked.
   */
  async function handleWallPlacement(row, col, orientation) {
    if (winner) {
      return;
    }

    // Browser is not assigned to a player
    if (!currentPlayer) {
      return;
    }

    // Not this browser's turn
    if (turn !== currentPlayer) {
      return;
    }

    const currentPlayerWalls =
      turn === 1
        ? player1Walls
        : player2Walls;

    if (currentPlayerWalls <= 0) {
      return;
    }

    const valid = isValidWallPlacement(
      walls,
      row,
      col,
      orientation,
      player1Pos,
      player2Pos
    );

    if (!valid) {
      return;
    }

    const newWall = {
      row,
      col,
      orientation,
      player: turn,
    };

    const newWalls = [
      ...walls,
      newWall,
    ];

    const newPlayer1Walls =
      turn === 1
        ? player1Walls - 1
        : player1Walls;

    const newPlayer2Walls =
      turn === 2
        ? player2Walls - 1
        : player2Walls;

    const newTurn = turn === 1 ? 2 : 1;

    const newState = {
      player1Pos,
      player2Pos,
      turn: newTurn,
      walls: newWalls,
      player1Walls: newPlayer1Walls,
      player2Walls: newPlayer2Walls,
      winner,
      player1Score,
      player2Score,
    };

    // Update local UI immediately
    setWalls(newWalls);
    setPlayer1Walls(newPlayer1Walls);
    setPlayer2Walls(newPlayer2Walls);
    setTurn(newTurn);

    // Save to Supabase
    await saveGameState(newState);
  }

  // async function testSupabase() {
  //   const { data, error } = await supabase
  //     .from("rooms")
  //     .select("*");

  //   console.log("Supabase data:", data);
  //   console.log("Supabase error:", error);
  // }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-parchment/60">
          Loading game...
        </p>
      </main>
    );
  }

  if (gameAbandoned) {
    return (
      <>
        <Head>
          <title>Blockiva — Opponent Left</title>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
        </Head>

        <main className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-2xl border border-board-cellLine bg-board-panel/80 p-8 text-center shadow-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
              👋
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-parchment">
              Opponent Left
            </h1>

            <p className="mt-3 text-sm leading-6 text-parchment/50">
              Your opponent has left the game.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-7 w-full rounded-xl bg-p1 px-5 py-3.5 font-medium text-board-bg transition hover:brightness-105 active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Blockiva — Game</title>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">

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

          {/* Active game actions */}
          {!winner && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleForfeitGame}
                className="rounded-lg px-4 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
              >
                Forfeit
              </button>

              <button
                type="button"
                onClick={handleQuitGame}
                className="rounded-lg px-4 py-2 text-sm text-parchment/50 transition hover:bg-white/5"
              >
                Quit Game
              </button>
            </div>
          )}

          {/* Game finished */}
          {winner && (
            <div className="rounded-xl bg-board-panel px-6 py-4 text-center">

              <div className="text-xl font-bold">
                🏆 Player {winner} Wins!
              </div>

              <div className="mt-1 text-sm opacity-70">
                {forfeitedBy
                  ? `Player ${forfeitedBy} forfeited the game.`
                  : `Player ${winner} reached the goal.`}
              </div>

              <button
                type="button"
                onClick={handlePlayAgain}
                disabled={
                  currentPlayer === 1
                    ? player1Ready
                    : player2Ready
                }
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentPlayer === 1
                  ? player1Ready
                    ? "Ready ✓"
                    : "Play Again"
                  : player2Ready
                    ? "Ready ✓"
                    : "Play Again"}
              </button>

              <button
                type="button"
                onClick={handleQuitGame}
                className="mt-2 ml-2 rounded-lg px-4 py-2 text-sm text-parchment/50 transition hover:bg-white/5"
              >
                Quit Game
              </button>

              <div className="mt-2 text-xs opacity-60">
                {player1Ready && player2Ready
                  ? "Starting new round..."
                  : player1Ready
                    ? "Player 1 is ready"
                    : player2Ready
                      ? "Player 2 is ready"
                      : "Both players must be ready"}
              </div>

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