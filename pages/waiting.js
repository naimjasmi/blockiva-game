import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { supabase } from "@/lib/supabase";

// Small 9x9 board motif
function BoardMotif() {
  const dots = Array.from({ length: 81 });

  return (
    <div className="grid grid-cols-9 gap-[6px]">
      {dots.map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-parchment/40"
        />
      ))}
    </div>
  );
}

export default function Waiting() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(1 * 60);

  useEffect(() => {
    if (!router.isReady) return;

    const roomCode = router.query.room;

    if (!roomCode) return;

    async function checkRoom() {
      const { data: room, error } = await supabase.rpc(
        "get_room",
        {
          code: roomCode,
        }
      );

      if (error) {
        console.error("Room error:", error);
        setError("Unable to find room.");
        setLoading(false);
        return;
      }

      if (!room) {
        setError("Room not found or expired.");
        setLoading(false);
        return;
      }

      if (room.status === "playing") {
        router.push(`/game?room=${roomCode}`);
        return;
      }

      const createdAt = new Date(room.created_at).getTime();
      const now = Date.now();

      const elapsedSeconds = Math.floor(
        (now - createdAt) / 1000
      );

      const remainingSeconds = Math.max(
        0,
        1 * 60 - elapsedSeconds
      );

      setTimeLeft(remainingSeconds);
      setLoading(false);
    }

    checkRoom();

    const channel = supabase
      .channel(`waiting-room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new.status === "playing") {
            router.push(`/game?room=${roomCode}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router.isReady, router.query.room]);

  // Countdown
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const roomCode = router.query.room;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-5 w-5 animate-spin rounded-full border-2 border-parchment/20 border-t-parchment/70" />

          <p className="text-sm text-parchment/50">
            Loading room...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Blockiva — Room Error</title>
        </Head>

        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />
          </div>

          <div className="relative w-full max-w-sm rounded-2xl border border-board-cellLine bg-board-panel/80 p-8 text-center shadow-2xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-2xl">
              !
            </div>

            <h1 className="mt-5 text-xl font-semibold text-parchment">
              Room unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-parchment/50">
              {error}
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 w-full rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-parchment transition hover:bg-white/15 active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </main>
      </>
    );
  }

  // Room expired
  if (timeLeft === 0) {
    return (
      <>
        <Head>
          <title>Blockiva — Room Expired</title>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
        </Head>

        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />
          </div>

          <div className="relative w-full max-w-sm rounded-2xl border border-board-cellLine bg-board-panel/80 p-8 text-center shadow-2xl">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
              ⏱
            </div>

            <h1 className="mt-5 text-2xl font-semibold text-parchment">
              Room Expired
            </h1>

            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-parchment/50">
              No opponent joined the room within 1 minute.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-7 w-full rounded-xl bg-p1 px-5 py-3.5 font-medium text-board-bg shadow-lg shadow-p1/10 transition hover:brightness-105 active:scale-[0.98]"
            >
              Create a New Game
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Blockiva — Waiting Room</title>

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

          {/* Small board motif */}
          <div className="mb-7 flex justify-center">
            <div className="rounded-2xl border border-board-cellLine bg-board-panel/70 p-4 shadow-xl">
              <BoardMotif />
            </div>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border border-board-cellLine bg-board-panel/80 p-6 shadow-2xl backdrop-blur">

            {/* Status */}
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-p2 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-p2" />
              </span>

              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-p2">
                Waiting for opponent
              </span>
            </div>

            {/* Heading */}
            <div className="mt-5 text-center">
              <h1 className="text-2xl font-semibold text-parchment">
                Your game is ready
              </h1>

              <p className="mt-2 text-sm leading-6 text-parchment/50">
                Share the code below with Player 2.
              </p>
            </div>

            {/* Game code */}
            <div className="mt-6 rounded-xl border border-board-cellLine bg-black/10 px-5 py-5 text-center">

              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-parchment/35">
                Game Code
              </p>

              <div className="mt-2 font-mono text-4xl font-semibold tracking-[0.28em] text-parchment">
                {roomCode}
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-6 text-center">

              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-parchment/35">
                Room expires in
              </p>

              <div
                className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${
                  timeLeft <= 10
                    ? "text-red-400"
                    : "text-parchment"
                }`}
              >
                {formattedTime}
              </div>

              {/* Progress bar */}
              <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-black/20">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeLeft <= 10
                      ? "bg-red-400"
                      : "bg-p2"
                  }`}
                  style={{
                    width: `${(timeLeft / 60) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Waiting message */}
            <div className="mt-6 rounded-lg bg-white/[0.025] px-4 py-3 text-center">
              <p className="text-xs text-parchment/40">
                The game will start automatically when Player 2 joins.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-[11px] text-parchment/25">
            9 × 9 board · 10 walls each · 2 players
          </p>
        </div>
      </main>
    </>
  );
}