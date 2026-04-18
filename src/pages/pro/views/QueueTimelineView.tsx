import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, X, ChevronRight, Circle } from "lucide-react";
import { toast } from "sonner";
import type { QueueViewProps } from "./types";
import {
  getQueueHistory,
  type HistoricTicket,
  type Ticket,
} from "@/api/queue";

const isToday = (isoDate: string | null | undefined): boolean => {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const formatTime = (isoDate: string | null | undefined): string => {
  if (!isoDate) return "--:--";
  try {
    return new Date(isoDate).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
};

type PastStatus = "completed" | "no_show" | "cancelled";

interface PastPillProps {
  ticket: HistoricTicket;
}

function PastPill({ ticket }: PastPillProps) {
  const status = ticket.status as PastStatus;
  const color =
    status === "completed"
      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100"
      : status === "no_show"
        ? "bg-amber-500/20 border-amber-500/30 text-amber-100"
        : "bg-white/5 border-white/10 text-white/60";

  const badge =
    status === "completed" ? (
      <Check size={12} />
    ) : status === "no_show" ? (
      <X size={12} />
    ) : (
      <Circle size={10} />
    );

  const label =
    status === "completed"
      ? "Traité"
      : status === "no_show"
        ? "Absent"
        : "Annulé";

  return (
    <button
      type="button"
      onClick={() => toast.info("Undo bientôt dispo")}
      title={`n°${ticket.number} · ${label}`}
      className={`group relative flex h-32 w-20 shrink-0 snap-center flex-col items-center justify-between rounded-xl border p-2 transition-all hover:scale-105 hover:ring-2 hover:ring-violet-500/40 ${color}`}
    >
      <div className="text-lg font-bold tabular-nums">
        n°{ticket.number}
      </div>
      <div className="text-[10px] tabular-nums opacity-75">
        {formatTime(ticket.completedAt ?? ticket.createdAt)}
      </div>
      <div className="flex items-center gap-1 rounded-full border border-current/20 bg-black/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider">
        {badge}
        <span>{label}</span>
      </div>
    </button>
  );
}

interface CurrentPillProps {
  ticket: Ticket;
  disabled: boolean;
  hasNext: boolean;
  onComplete: (ticketId: number, withNext: boolean) => void;
  onNoShow: (ticketId: number, withNext: boolean) => void;
}

function CurrentPill({
  ticket,
  disabled,
  hasNext,
  onComplete,
  onNoShow,
}: CurrentPillProps) {
  return (
    <div
      className="group relative flex h-32 w-20 shrink-0 snap-center flex-col items-center justify-between rounded-xl border border-violet-500/40 bg-violet-500/20 p-2 text-violet-100 transition-all hover:scale-105 hover:ring-2 hover:ring-violet-500/50"
      title={`n°${ticket.number} · En service`}
    >
      {/* Pulse halo */}
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-violet-500/10 animate-pulse" />

      <div className="relative z-10 text-lg font-bold tabular-nums">
        n°{ticket.number}
      </div>
      <div className="relative z-10 text-[10px] tabular-nums opacity-75">
        {formatTime(ticket.calledAt)}
      </div>
      <div className="relative z-10 flex items-center gap-1 rounded-full border border-violet-400/30 bg-black/30 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-violet-200">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-300" />
        </span>
        Live
      </div>

      {/* Mini action buttons overlay */}
      <div className="absolute inset-0 z-20 flex items-end justify-center gap-1 rounded-xl bg-black/50 p-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onComplete(ticket.id, false)}
          disabled={disabled}
          title="Traité"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/20 text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={() => onNoShow(ticket.id, hasNext)}
          disabled={disabled}
          title="Absent"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-amber-200 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={14} />
        </button>
        <button
          type="button"
          onClick={() => onComplete(ticket.id, true)}
          disabled={disabled || !hasNext}
          title="Suivant"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/20 text-violet-200 transition-colors hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

interface WaitingPillProps {
  ticket: Ticket;
  disabled: boolean;
  onClick: () => void;
}

function WaitingPill({ ticket, disabled, onClick }: WaitingPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`n°${ticket.number} · En attente`}
      className="group flex h-32 w-20 shrink-0 snap-center flex-col items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2 text-white/80 transition-all hover:scale-105 hover:border-violet-500/40 hover:bg-white/[0.05] hover:ring-2 hover:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="text-lg font-bold tabular-nums text-white">
        n°{ticket.number}
      </div>
      <div className="text-[10px] tabular-nums text-white/50">
        {formatTime(ticket.createdAt)}
      </div>
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/60">
        <Circle size={8} />
        Attente
      </div>
    </button>
  );
}

export default function QueueTimelineView(props: QueueViewProps) {
  const {
    queue,
    currentTickets,
    waitingTickets,
    stats,
    actionLoading,
    onComplete,
    onNoShow,
    onCallSpecific,
  } = props;

  const [history, setHistory] = useState<HistoricTicket[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nowMarkerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef<boolean>(false);

  // Fetch history, re-run when current ticket set changes
  const currentKey = currentTickets.map((t) => t.id).join(",");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const res = await getQueueHistory(queue.id, "7d", { limit: 50 });
        if (cancelled) return;
        const todayPast = res.tickets
          .filter((t) => {
            if (
              t.status !== "completed" &&
              t.status !== "no_show" &&
              t.status !== "cancelled"
            ) {
              return false;
            }
            return isToday(t.completedAt) || isToday(t.createdAt);
          })
          .sort((a, b) => {
            const ta = a.completedAt
              ? new Date(a.completedAt).getTime()
              : new Date(a.createdAt).getTime();
            const tb = b.completedAt
              ? new Date(b.completedAt).getTime()
              : new Date(b.createdAt).getTime();
            return ta - tb;
          });
        setHistory(todayPast);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [queue.id, currentKey]);

  // Auto-scroll au mount pour centrer "NOW"
  useLayoutEffect(() => {
    if (hasAutoScrolledRef.current) return;
    if (historyLoading) return;
    const container = scrollRef.current;
    const marker = nowMarkerRef.current;
    if (!container || !marker) return;
    const containerRect = container.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const markerCenterInContainer =
      markerRect.left - containerRect.left + container.scrollLeft;
    const target = markerCenterInContainer - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, target);
    hasAutoScrolledRef.current = true;
  }, [historyLoading, history.length, currentTickets.length, waitingTickets.length]);

  const hasNext = waitingTickets.length > 0;
  const avgWaitMin = stats ? Math.round((stats.avgWaitTime ?? 0) / 60) : 0;

  const isEmpty = useMemo(
    () =>
      history.length === 0 &&
      currentTickets.length === 0 &&
      waitingTickets.length === 0,
    [history.length, currentTickets.length, waitingTickets.length],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Timeline container */}
      <div
        ref={scrollRef}
        className="relative flex-1 min-h-0 overflow-x-auto overflow-y-hidden rounded-2xl border border-white/5 bg-[#09090B] snap-x"
        style={{ scrollBehavior: "smooth" }}
      >
        {isEmpty && !historyLoading ? (
          <div className="flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-2 p-10 text-center text-white/40">
            <Circle size={36} className="opacity-40" />
            <p className="text-base font-medium">
              Journée tranquille. Personne dans la file.
            </p>
          </div>
        ) : (
          <div className="relative flex h-full min-h-[240px] w-max items-center">
            {/* Ligne temporelle horizontale */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-white/10" />

            {/* Zone Passé */}
            <div className="relative z-10 flex items-center gap-2 px-4 py-6">
              {historyLoading && history.length === 0 ? (
                <div className="flex h-32 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              ) : (
                history.map((t) => <PastPill key={`past-${t.id}`} ticket={t} />)
              )}
            </div>

            {/* Zone Maintenant (marker + current pills) */}
            <div className="relative z-20 flex shrink-0 items-center">
              {/* Marker NOW */}
              <div
                ref={nowMarkerRef}
                className="relative flex h-full flex-col items-center justify-center px-2"
              >
                <span className="absolute top-2 z-30 inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-100">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-300" />
                  </span>
                  NOW
                </span>
                <div className="h-full w-0.5 animate-pulse bg-violet-500" />
              </div>

              {/* Current pills (empilées verticalement) */}
              <div className="flex min-w-[96px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-violet-500/40 bg-violet-500/5 px-3 py-4">
                {currentTickets.length === 0 ? (
                  <div className="flex h-32 w-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-2 text-center text-[10px] text-violet-200/70">
                    <Circle size={16} className="opacity-60" />
                    <span>Aucun ticket en service</span>
                  </div>
                ) : (
                  currentTickets.map((t) => (
                    <CurrentPill
                      key={`cur-${t.id}`}
                      ticket={t}
                      disabled={actionLoading}
                      hasNext={hasNext}
                      onComplete={onComplete}
                      onNoShow={onNoShow}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Zone Futur */}
            <div className="relative z-10 flex items-center gap-2 px-4 py-6">
              {waitingTickets.length === 0 ? (
                <div className="flex h-32 w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-2 text-center text-[10px] text-white/40">
                  <Circle size={16} className="opacity-50" />
                  <span>File vide</span>
                </div>
              ) : (
                waitingTickets.map((t) => (
                  <WaitingPill
                    key={`wait-${t.id}`}
                    ticket={t}
                    disabled={actionLoading}
                    onClick={() => onCallSpecific(t.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer stats compactes */}
      <div className="flex h-12 shrink-0 flex-wrap items-center gap-2 rounded-xl border border-white/5 border-t-white/10 bg-white/[0.02] px-4 text-sm text-white/60">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
          <Check size={12} />
          <span className="text-white/50">Traités :</span>
          <span className="font-semibold tabular-nums">
            {stats?.completed ?? 0}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-200">
          <X size={12} />
          <span className="text-white/50">Absents :</span>
          <span className="font-semibold tabular-nums">
            {stats?.noShow ?? 0}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-violet-200">
          <Circle size={10} />
          <span className="text-white/50">Attente :</span>
          <span className="font-semibold tabular-nums">
            {stats?.waiting ?? waitingTickets.length}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-white/70">
          <span className="text-white/50">Attente moy. :</span>
          <span className="font-semibold tabular-nums">{avgWaitMin} min</span>
        </span>
      </div>
    </div>
  );
}
