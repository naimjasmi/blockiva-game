import { useEffect, useState } from "react";

/*
 * Tiny 5x5 board used for the tutorial pictures.
 *
 * p1 / p2:     { row, col }
 * highlight:   [{ row, col }]  (cells you can move to)
 * goalRow:     row to tint (0 = top, 4 = bottom)
 * wall:        { row, col, orientation }  (same idea as the real game)
 *              horizontal: sits above `row`, spans col and col+1
 *              vertical:   sits left of `col`, spans row and row+1
 */
function MiniBoard({ p1, p2, highlight = [], goalRow, wall }) {
    const SIZE = 5;

    return (
        <div className="relative mx-auto aspect-square w-40 rounded-lg bg-black/20 p-1.5">
            <div className="relative grid h-full w-full grid-cols-5 grid-rows-5 gap-1">
                {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                    const row = Math.floor(i / SIZE);
                    const col = i % SIZE;

                    const isHighlight = highlight.some(
                        (h) => h.row === row && h.col === col
                    );

                    return (
                        <div
                            key={i}
                            className={`flex items-center justify-center rounded-md ${isHighlight
                                    ? "bg-emerald-400/30 ring-1 ring-emerald-400/60"
                                    : row === goalRow
                                        ? "bg-p2/15"
                                        : "bg-board-cell"
                                }`}
                        >
                            {p1 && p1.row === row && p1.col === col && (
                                <span className="h-4 w-4 rounded-full bg-p1" />
                            )}
                            {p2 && p2.row === row && p2.col === col && (
                                <span className="h-4 w-4 rounded-full bg-p2" />
                            )}
                        </div>
                    );
                })}

                {wall && wall.orientation === "horizontal" && (
                    <span
                        className="absolute rounded-full bg-p1"
                        style={{
                            top: `${(wall.row / SIZE) * 100}%`,
                            left: `${(wall.col / SIZE) * 100}%`,
                            width: `${(2 / SIZE) * 100}%`,
                            height: 5,
                            transform: "translateY(-50%)",
                        }}
                    />
                )}

                {wall && wall.orientation === "vertical" && (
                    <span
                        className="absolute rounded-full bg-p1"
                        style={{
                            left: `${(wall.col / SIZE) * 100}%`,
                            top: `${(wall.row / SIZE) * 100}%`,
                            height: `${(2 / SIZE) * 100}%`,
                            width: 5,
                            transform: "translateX(-50%)",
                        }}
                    />
                )}
            </div>
        </div>
    );
}

const STEPS = [
    {
        title: "Reach the other side",
        body: "You are the orange piece. Your goal is to get to the top row (the faint tinted row) before your opponent reaches the bottom.",
        visual: (
            <MiniBoard
                p1={{ row: 4, col: 2 }}
                p2={{ row: 0, col: 2 }}
                goalRow={0}
            />
        ),
    },
    {
        title: "Move one step",
        body: "On your turn you can move one square up, down, left or right. Tap a green highlighted square to move there. No diagonals and no jumping.",
        visual: (
            <MiniBoard
                p1={{ row: 3, col: 2 }}
                p2={{ row: 0, col: 2 }}
                highlight={[
                    { row: 2, col: 2 },
                    { row: 4, col: 2 },
                    { row: 3, col: 1 },
                    { row: 3, col: 3 },
                ]}
                goalRow={0}
            />
        ),
    },
    {
        title: "Or place a wall",
        body: "Instead of moving, you can slow your opponent down with a wall. Each player has 10 walls, and a wall covers two squares. Nobody can walk through it.",
        visual: (
            <MiniBoard
                p1={{ row: 4, col: 2 }}
                p2={{ row: 1, col: 2 }}
                wall={{ row: 2, col: 1, orientation: "horizontal" }}
                goalRow={0}
            />
        ),
    },
    {
        title: "How to place a wall",
        body: (
            <>
                Press and hold on the thin gap between two squares until a coloured
                preview appears. Drag to choose the exact spot, then{" "}
                <b>release</b> to place it. Tip: a quick tap does nothing, so you
                can't place one by accident.
            </>
        ),
        visual: (
            <MiniBoard
                p1={{ row: 4, col: 2 }}
                p2={{ row: 1, col: 3 }}
                wall={{ row: 1, col: 2, orientation: "vertical" }}
                goalRow={0}
            />
        ),
    },
    {
        title: "The rules to remember",
        body: (
            <ul className="space-y-3 text-left">
                {[
                    "You can never block a player completely. There must always be a path to their goal.",
                    "Moving or placing a wall both use up your turn.",
                    "Walls run out after 10, so use them wisely.",
                    "First to reach the opposite row wins the round. Scores carry over when you play again.",
                ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-p1/20 text-[11px] font-semibold text-p1">
                            {i + 1}
                        </span>
                        <span>{rule}</span>
                    </li>
                ))}
            </ul>
        ),
        visual: null,
    },
];

export default function HowToPlay({ open, onClose }) {
    const [step, setStep] = useState(0);

    // Restart from the first step each time it opens
    useEffect(() => {
        if (open) setStep(0);
    }, [open]);

    // Close with Escape
    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const current = STEPS[step];
    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-2xl border border-board-cellLine bg-board-panel p-6 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-parchment/40">
                    How to play · {step + 1}/{STEPS.length}
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-parchment">
                    {current.title}
                </h2>

                {current.visual && <div className="mt-5">{current.visual}</div>}

                <div className="mt-5 min-h-[96px] text-sm leading-6 text-parchment/70">
                    {current.body}
                </div>

                {/* Progress dots */}
                <div className="mt-4 flex justify-center gap-1.5">
                    {STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-p1" : "w-1.5 bg-parchment/20"
                                }`}
                        />
                    ))}
                </div>

                <div className="mt-5 flex items-center gap-2">
                    {isFirst ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-parchment/50 transition hover:bg-white/5"
                        >
                            Skip
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="flex-1 rounded-xl px-4 py-3 text-sm text-parchment/60 transition hover:bg-white/5"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => (isLast ? onClose() : setStep(step + 1))}
                        className="flex-1 rounded-xl bg-p1 px-4 py-3 text-sm font-medium text-board-bg transition hover:brightness-105 active:scale-[0.98]"
                    >
                        {isLast ? "Let's play!" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}