import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Plus,
  Keyboard,
  Users,
} from "lucide-react";
import type { QueueViewProps } from "./types";

function formatElapsed(
  calledAt: string | null | undefined,
  now: number,
): string {
  if (!calledAt) return "00:00";
  const elapsed = Math.max(
    0,
    Math.floor((now - new Date(calledAt).getTime()) / 1000),
  );
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function QueueComptoirView(props: QueueViewProps) {
  const {
    currentTickets,
    waitingTickets,
    actionLoading,
    onComplete,
    onNoShow,
    onCallNext,
    onCallSpecific,
  } = props;

  const [focusSeatId, setFocusSeatId] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  // Keep ticking for timers
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Sync focusSeatId with currentTickets (default: last called)
  const currentIdsSignature = currentTickets.map((t) => t.id).join(",");
  useEffect(() => {
    if (currentTickets.length === 0) {
      setFocusSeatId(null);
      return;
    }
    setFocusSeatId((prev) => {
      if (prev !== null && currentTickets.some((t) => t.id === prev)) {
        return prev;
      }
      return currentTickets[currentTickets.length - 1]?.id ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdsSignature]);

  const focusTicket = useMemo(
    () => currentTickets.find((t) => t.id === focusSeatId) ?? null,
    [currentTickets, focusSeatId],
  );

  const otherCurrent = useMemo(
    () => currentTickets.filter((t) => t.id !== focusSeatId),
    [currentTickets, focusSeatId],
  );

  const hasWaiting = waitingTickets.length > 0;
  const nextWaitingNumber = waitingTickets[0]?.number;

  // Keep latest refs for handlers to avoid stale state in the keydown listener
  const stateRef = useRef({
    focusSeatId,
    currentTickets,
    hasWaiting,
    actionLoading,
    drawerOpen,
  });
  stateRef.current = {
    focusSeatId,
    currentTickets,
    hasWaiting,
    actionLoading,
    drawerOpen,
  };

  const handlersRef = useRef({
    onComplete,
    onNoShow,
    onCallNext,
  });
  handlersRef.current = { onComplete, onNoShow, onCallNext };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const s = stateRef.current;
      const h = handlersRef.current;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (s.actionLoading) return;
        if (s.focusSeatId === null) {
          if (s.hasWaiting) h.onCallNext();
        } else if (s.hasWaiting) {
          h.onComplete(s.focusSeatId, true);
        }
        return;
      }

      if (e.key === "v" || e.key === "V") {
        if (s.focusSeatId !== null && !s.actionLoading) {
          e.preventDefault();
          h.onComplete(s.focusSeatId, false);
        }
        return;
      }

      if (e.key === "x" || e.key === "X") {
        if (s.focusSeatId !== null && !s.actionLoading) {
          e.preventDefault();
          h.onNoShow(s.focusSeatId, false);
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        if (s.currentTickets.length === 0) return;
        e.preventDefault();
        const idx = s.currentTickets.findIndex((t) => t.id === s.focusSeatId);
        if (idx === -1) {
          setFocusSeatId(s.currentTickets[0]?.id ?? null);
          return;
        }
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const nextIdx =
          (idx + delta + s.currentTickets.length) % s.currentTickets.length;
        const nextT = s.currentTickets[nextIdx];
        if (nextT) setFocusSeatId(nextT.id);
        return;
      }

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setDrawerOpen((v) => !v);
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10) - 1;
        const t = s.currentTickets[n];
        if (t) {
          e.preventDefault();
          setFocusSeatId(t.id);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090B] text-white">
      {/* Drawer left */}
      <aside
        className={[
          "relative h-full shrink-0 overflow-hidden border-r border-white/5 bg-white/[0.02] transition-[width] duration-300 ease-out",
          drawerOpen ? "w-60" : "w-0",
        ].join(" ")}
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-full w-60 flex-col">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
              <Users className="h-4 w-4 text-violet-400" />
              <span>File d'attente</span>
            </div>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400">
              {waitingTickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {waitingTickets.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-500">
                Aucun ticket en attente
              </div>
            ) : (
              <ul className="flex flex-col gap-1">
                {waitingTickets.map((t, idx) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onCallSpecific(t.id)}
                      className="group flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left transition hover:border-violet-400/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-lg font-semibold text-white">
                          {t.number}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-500 transition group-hover:text-violet-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Drawer toggle */}
      <button
        type="button"
        onClick={() => setDrawerOpen((v) => !v)}
        className="absolute top-1/2 z-20 flex h-10 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-white/10 bg-white/[0.04] text-gray-300 transition hover:bg-violet-500/20 hover:text-white"
        style={{ left: drawerOpen ? "240px" : "0px", transition: "left 300ms" }}
        aria-label={drawerOpen ? "Fermer le drawer" : "Ouvrir le drawer"}
      >
        {drawerOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-2 px-6 py-3">
          <div className="mr-auto flex items-center gap-3 text-xs text-gray-500">
            <span className="rounded-md bg-white/5 px-2 py-1">
              {currentTickets.length} en cours
            </span>
            <span className="rounded-md bg-white/5 px-2 py-1">
              {waitingTickets.length} en attente
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowShortcuts((v) => !v)}
            className="relative inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300 transition hover:border-violet-400/40 hover:text-white"
            aria-label="Raccourcis clavier"
          >
            <Keyboard className="h-4 w-4" />
            <span>Raccourcis</span>
          </button>
          {showShortcuts && (
            <div className="absolute right-6 top-14 z-30 w-72 rounded-xl border border-white/10 bg-[#0E0E12] p-4 text-xs text-gray-300 shadow-2xl shadow-black/40">
              <div className="mb-2 text-sm font-medium text-white">
                Raccourcis clavier
              </div>
              <ul className="flex flex-col gap-1.5">
                <li className="flex justify-between">
                  <span className="text-gray-400">Appeler / Traité+Suiv.</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                    Espace
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Traité seul</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                    V
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Absent</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                    X
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Switch siège</span>
                  <span className="flex gap-1">
                    <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                      ←
                    </kbd>
                    <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                      →
                    </kbd>
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Siège 1-9</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                    1-9
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-400">Drawer</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px]">
                    D
                  </kbd>
                </li>
              </ul>
            </div>
          )}
        </header>

        {/* Focus seat zone */}
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          {focusTicket ? (
            <div className="flex w-full max-w-3xl flex-col items-center">
              <div className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Siège focus
              </div>
              <div className="mt-4 select-none bg-gradient-to-br from-violet-400 via-violet-500 to-fuchsia-500 bg-clip-text font-mono text-9xl font-black leading-none text-transparent">
                {focusTicket.number}
              </div>
              <div className="mt-6 font-mono text-4xl tabular-nums text-gray-300">
                {formatElapsed(focusTicket.calledAt, now)}
              </div>

              <div className="mt-12 grid w-full grid-cols-3 gap-4">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onComplete(focusTicket.id, false)}
                  className="group inline-flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-2xl font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-8 w-8" />
                  <span>Traité</span>
                  <span className="text-xs font-normal text-emerald-100/80">
                    V
                  </span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onNoShow(focusTicket.id, false)}
                  className="group inline-flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-2xl font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-8 w-8" />
                  <span>Absent</span>
                  <span className="text-xs font-normal text-amber-100/80">
                    X
                  </span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !hasWaiting}
                  onClick={() => onComplete(focusTicket.id, true)}
                  className="group inline-flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-8 text-2xl font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-8 w-8" />
                  <span>Suivant</span>
                  <span className="text-xs font-normal text-violet-100/80">
                    Espace
                  </span>
                </button>
              </div>
            </div>
          ) : hasWaiting ? (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onCallNext()}
              className="group flex flex-col items-center gap-4 rounded-3xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 px-16 py-12 transition hover:border-violet-400/60 hover:from-violet-500/20 hover:to-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-violet-300/80">
                Appeler
              </div>
              <div className="bg-gradient-to-br from-violet-400 to-fuchsia-500 bg-clip-text font-mono text-8xl font-black text-transparent">
                n°{nextWaitingNumber}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white">
                <kbd className="font-mono text-xs">Espace</kbd>
                <span className="text-gray-300">pour appeler</span>
              </div>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Users className="h-8 w-8 text-gray-600" />
              </div>
              <div className="text-xl font-medium text-gray-300">
                Aucun client
              </div>
              <div className="text-sm text-gray-500">File vide.</div>
            </div>
          )}
        </main>

        {/* Bottom rail */}
        <footer className="border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            {otherCurrent.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFocusSeatId(t.id)}
                className="group flex h-16 shrink-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 transition hover:ring-2 hover:ring-violet-400/50"
              >
                <span className="font-mono text-xl font-semibold text-white">
                  {t.number}
                </span>
                <span className="font-mono text-sm tabular-nums text-gray-400">
                  {formatElapsed(t.calledAt, now)}
                </span>
              </button>
            ))}
            <button
              type="button"
              disabled={actionLoading || !hasWaiting}
              onClick={() => onCallNext()}
              className="flex h-16 shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-white/15 px-4 text-sm text-gray-300 transition hover:border-violet-400/60 hover:bg-violet-500/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Appeler le suivant"
            >
              <Plus className="h-5 w-5" />
              <span>
                {hasWaiting ? `Appeler n°${nextWaitingNumber}` : "Aucun"}
              </span>
            </button>
          </div>

          <div className="mt-3 text-center text-xs text-gray-500">
            Espace appeler · V traité · X absent · ←→ switch · D drawer
          </div>
        </footer>
      </div>
    </div>
  );
}
