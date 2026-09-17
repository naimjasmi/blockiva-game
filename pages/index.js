import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/roomCode";
import { getPlayerSessionId } from "@/lib/playerSession";

// Decorative 9x9 board motif
function BoardMotif() {
  const dots = Array.from({ length: 81 });

  return (
    <div className="grid grid-cols-9 gap-[7px]">
      {dots.map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-parchment/50"
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [joinError, setJoinError] = useState("");

  const router = useRouter();

  async function handleCreateGame() {
    setCreatingRoom(true);
    setCreateError("");

    const sessionId = getPlayerSessionId();
    const code = generateRoomCode();

    const { error } = await supabase
      .from("rooms")
      .insert({
        room_code: code,
        player1_session_id: sessionId,
        game_state: {
          player1Pos: { row: 8, col: 4 },
          player2Pos: { row: 0, col: 4 },
          turn: 1,
          walls: [],
          player1Walls: 10,
          player2Walls: 10,
          winner: null,
          player1Score: 0,
          player2Score: 0,
          player1Ready: false,
          player2Ready: false,
        },
      });

    if (error) {
      console.error("Create room error:", error);
      setCreateError("Could not create game.");
      setCreatingRoom(false);
      return;
    }

    setCreatingRoom(false);
    router.push(`/waiting?room=${code}`);
  }

  async function handleJoinGame() {
    setJoiningRoom(true);
    setJoinError("");

    const sessionId = getPlayerSessionId();
    const code = joinCode.trim().toUpperCase();

    const { data: room, error: findError } = await supabase.rpc(
      "get_room",
      {
        code,
      }
    );

    if (findError) {
      console.error("Find room error:", findError);
      setJoinError("Could not check the game.");
      setJoiningRoom(false);
      return;
    }

    if (!room) {
      setJoinError("Game not found.");
      setJoiningRoom(false);
      return;
    }

    if (room.status !== "waiting") {
      setJoinError("This game has already started.");
      setJoiningRoom(false);
      return;
    }

    const { error: joinError } = await supabase.rpc("join_room", {
      code,
      session_id: sessionId,
    });

    if (joinError) {
      console.error("Join room error:", joinError);
      setJoinError(joinError.message);
      setJoiningRoom(false);
      return;
    }

    setJoiningRoom(false);
    router.push(`/game?room=${code}`);
  }

  return (
    <>
      <Head>
        <title>Blockiva</title>

        <meta
          name="description"
          content="A two-player strategy board game."
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">

        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm">

          {/* Logo / Board motif */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl border border-board-cellLine bg-board-panel/70 p-4 shadow-xl">
              <BoardMotif />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.35em] text-parchment/40">
              Two Player Strategy
            </p>

            <h1 className="text-5xl font-semibold tracking-tight text-parchment">
              Blockiva
            </h1>

            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-parchment/55">
              Race across the board, place walls, and outmaneuver your
              opponent.
            </p>
          </div>

          {/* Main action card */}
          <div className="mt-9 rounded-2xl border border-board-cellLine bg-board-panel/80 p-5 shadow-2xl backdrop-blur">

            {/* Create */}
            <button
              type="button"
              onClick={handleCreateGame}
              disabled={creatingRoom}
              className="group w-full rounded-xl bg-p1 px-6 py-3.5 font-medium text-board-bg shadow-lg shadow-p1/10 transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {creatingRoom ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-board-bg/30 border-t-board-bg" />
                    Creating game...
                  </>
                ) : (
                  <>
                    Create game
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </span>
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-board-cellLine" />
              <span className="text-[10px] uppercase tracking-widest text-parchment/30">
                or
              </span>
              <div className="h-px flex-1 bg-board-cellLine" />
            </div>

            {/* Join */}
            <button
              type="button"
              onClick={() =>
                setMode(mode === "join" ? null : "join")
              }
              className={`w-full rounded-xl border px-6 py-3.5 font-medium transition active:scale-[0.98] ${
                mode === "join"
                  ? "border-p2 bg-p2/10 text-p2"
                  : "border-p2/40 bg-transparent text-p2 hover:border-p2 hover:bg-p2/5"
              }`}
            >
              {mode === "join" ? "Close join game" : "Join game"}
            </button>

            {/* Join form */}
            {mode === "join" && (
              <div className="mt-4 rounded-xl border border-board-cellLine bg-black/10 p-4">

                <label className="mb-2 block text-center text-[10px] font-medium uppercase tracking-widest text-parchment/40">
                  Game code
                </label>

                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase())
                  }
                  placeholder="ABC123"
                  className="w-full rounded-lg border border-board-cellLine bg-board-cell px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-parchment outline-none transition placeholder:tracking-[0.2em] placeholder:text-parchment/20 focus:border-p2"
                />

                <button
                  type="button"
                  onClick={handleJoinGame}
                  disabled={joinCode.length !== 6 || joiningRoom}
                  className="mt-3 w-full rounded-lg bg-p2 px-6 py-3 font-medium text-board-bg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  {joiningRoom ? "Joining..." : "Enter game"}
                </button>

                {joinError && (
                  <p className="mt-3 text-center text-xs text-red-400">
                    {joinError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-parchment/25">
            9 × 9 board · 10 walls each · 2 players
          </p>

          {createError && (
            <p className="mt-3 text-center text-xs text-red-400">
              {createError}
            </p>
          )}
        </div>
      </main>
    </>
  );
}