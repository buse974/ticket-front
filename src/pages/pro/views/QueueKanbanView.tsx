import { useEffect, useState } from "react";
import {
  Users,
  Check,
  X,
  ChevronRight,
  Plus,
  History,
  Clock,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { QueueViewProps } from "./types";
import {
  getQueueHistory,
  type HistoricTicket,
  type Ticket,
} from "@/api/queue";

type DragKind = "waiting" | "serving";

interface DraggableData {
  kind: DragKind;
  ticket: Ticket;
}

function formatElapsed(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(iso?: string | null): string {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function isToday(iso?: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function statusChip(status: HistoricTicket["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "completed":
      return {
        label: "Traité",
        className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      };
    case "no_show":
      return {
        label: "Absent",
        className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      };
    case "cancelled":
      return {
        label: "Annulé",
        className: "bg-white/10 text-white/60 border-white/10",
      };
    default:
      return {
        label: status,
        className: "bg-white/10 text-white/60 border-white/10",
      };
  }
}

interface WaitingCardProps {
  ticket: Ticket;
  isNext: boolean;
  disabled: boolean;
  onClick: () => void;
}

function WaitingCard({ ticket, isNext, disabled, onClick }: WaitingCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `waiting-${ticket.id}`,
    data: { kind: "waiting", ticket } satisfies DraggableData,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative w-full rounded-xl border p-3 text-left transition-all touch-none ${
        isNext
          ? "border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/30"
          : "border-white/5 bg-white/[0.03] hover:border-violet-500/40 hover:bg-white/[0.05]"
      } ${isDragging ? "opacity-40" : ""} ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
      } hover:scale-[1.01]`}
      onClick={(e) => {
        if (isDragging) return;
        e.preventDefault();
        if (!disabled) onClick();
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {isNext && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
          </span>
          Suivant
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-white">
            n°{ticket.number}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/50">
            <Clock size={12} />
            {formatTime(ticket.createdAt)}
          </span>
        </div>
        <ChevronRight
          size={20}
          className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-violet-400"
        />
      </div>
    </div>
  );
}

interface ServingCardProps {
  ticket: Ticket;
  now: number;
  disabled: boolean;
  hasWaiting: boolean;
  onComplete: (ticketId: number, withNext: boolean) => void;
  onNoShow: (ticketId: number, withNext: boolean) => void;
}

function ServingCard({
  ticket,
  now,
  disabled,
  hasWaiting,
  onComplete,
  onNoShow,
}: ServingCardProps) {
  const elapsedSec = ticket.calledAt
    ? Math.max(
        0,
        Math.floor((now - new Date(ticket.calledAt).getTime()) / 1000),
      )
    : 0;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `serving-${ticket.id}`,
    data: { kind: "serving", ticket } satisfies DraggableData,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 touch-none ${
        isDragging ? "opacity-40" : ""
      } ${disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="bg-gradient-to-br from-violet-400 to-fuchsia-400 bg-clip-text text-4xl font-bold tabular-nums text-transparent">
            n°{ticket.number}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
            <Clock size={12} />
            <span className="tabular-nums">{formatElapsed(elapsedSec)}</span>
            <span className="text-white/30">·</span>
            <span>appelé à {formatTime(ticket.calledAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onComplete(ticket.id, false)}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-2 text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={18} />
          <span className="text-[11px] font-medium">Traité</span>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onNoShow(ticket.id, hasWaiting)}
          disabled={disabled}
          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-amber-300 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={18} />
          <span className="text-[11px] font-medium">Absent</span>
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onComplete(ticket.id, true)}
          disabled={disabled || !hasWaiting}
          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-2 text-violet-300 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={18} />
          <span className="text-[11px] font-medium">Suivant</span>
        </button>
      </div>
    </div>
  );
}

function ServingDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "drop-serving" });
  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed backdrop-blur-sm transition-all ${
        isOver
          ? "border-emerald-400 bg-emerald-500/25"
          : "border-emerald-500/40 bg-emerald-500/15"
      }`}
    >
      <ChevronRight size={36} className="text-emerald-300" />
      <div className="text-lg font-bold text-emerald-100">Appeler ce ticket</div>
    </div>
  );
}

function DoneDropZones({ active }: { active: boolean }) {
  const { setNodeRef: setDoneRef, isOver: isOverDone } = useDroppable({
    id: "drop-done-completed",
  });
  const { setNodeRef: setNoShowRef, isOver: isOverNoShow } = useDroppable({
    id: "drop-done-no_show",
  });
  if (!active) return null;
  return (
    <div className="absolute inset-0 z-10 flex flex-col gap-2 p-2 backdrop-blur-sm">
      <div
        ref={setDoneRef}
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
          isOverDone
            ? "border-emerald-400 bg-emerald-500/30 scale-[1.02]"
            : "border-emerald-500/50 bg-emerald-500/15"
        }`}
      >
        <Check size={36} className="text-emerald-300" />
        <div className="text-lg font-bold text-emerald-100">Traité</div>
      </div>
      <div
        ref={setNoShowRef}
        className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
          isOverNoShow
            ? "border-amber-400 bg-amber-500/30 scale-[1.02]"
            : "border-amber-500/50 bg-amber-500/15"
        }`}
      >
        <X size={36} className="text-amber-300" />
        <div className="text-lg font-bold text-amber-100">Absent</div>
      </div>
    </div>
  );
}

export default function QueueKanbanView(props: QueueViewProps) {
  const {
    queue,
    currentTickets,
    waitingTickets,
    stats,
    actionLoading,
    onComplete,
    onNoShow,
    onCallNext,
    onCallSpecific,
  } = props;

  const [now, setNow] = useState<number>(() => Date.now());
  const [history, setHistory] = useState<HistoricTicket[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [dragData, setDragData] = useState<DraggableData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const res = await getQueueHistory(queue.id, "7d", { limit: 30 });
        if (cancelled) return;
        const todayTickets = res.tickets
          .filter((t) => isToday(t.completedAt) || isToday(t.createdAt))
          .sort((a, b) => {
            const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return tb - ta;
          });
        setHistory(todayTickets);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.id, currentTickets.length, currentTickets.map((t) => t.id).join(",")]);

  const nextWaiting = waitingTickets[0];
  const hasWaiting = waitingTickets.length > 0;
  const noShowRate = stats?.noShowRate ?? 0;
  const avgWaitMin = stats ? Math.round((stats.avgWaitTime ?? 0) / 60) : 0;

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DraggableData | undefined;
    if (data) setDragData(data);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DraggableData | undefined;
    const overId = event.over?.id;
    setDragData(null);
    if (!data || !overId) return;

    if (data.kind === "waiting" && overId === "drop-serving") {
      onCallSpecific(data.ticket.id);
      return;
    }
    if (data.kind === "serving" && overId === "drop-done-completed") {
      onComplete(data.ticket.id, false);
      return;
    }
    if (data.kind === "serving" && overId === "drop-done-no_show") {
      onNoShow(data.ticket.id, false);
      return;
    }
  };

  const isDraggingWaiting = dragData?.kind === "waiting";
  const isDraggingServing = dragData?.kind === "serving";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragData(null)}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Colonne 1 — En attente */}
          <section className="flex min-h-0 flex-col rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-200">
                <Users size={18} />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  En attente
                </h2>
              </div>
              <span className="rounded-full border border-violet-500/40 bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-100 tabular-nums">
                {waitingTickets.length}
              </span>
            </header>
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
              {waitingTickets.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-white/40">
                  <Users size={28} className="opacity-50" />
                  <p className="text-sm">Personne en attente</p>
                </div>
              ) : (
                waitingTickets.map((t) => (
                  <WaitingCard
                    key={t.id}
                    ticket={t}
                    isNext={nextWaiting?.id === t.id}
                    disabled={actionLoading}
                    onClick={() => onCallSpecific(t.id)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Colonne 2 — En service */}
          <section className="relative flex min-h-0 flex-col rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-200">
                <Check size={18} />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  En service
                </h2>
              </div>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-100 tabular-nums">
                {currentTickets.length}
              </span>
            </header>
            <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
              {currentTickets.length === 0 && hasWaiting ? (
                <button
                  type="button"
                  onClick={onCallNext}
                  disabled={actionLoading}
                  className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-500/10 p-6 text-center transition-all hover:scale-[1.01] hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="rounded-full bg-violet-500/20 p-3 text-violet-200">
                    <ChevronRight size={28} />
                  </div>
                  <div className="bg-gradient-to-br from-violet-300 to-fuchsia-300 bg-clip-text text-2xl font-bold text-transparent">
                    Appeler n°{nextWaiting?.number}
                  </div>
                  <p className="text-xs text-white/50">
                    Cliquez ou glissez le ticket ici
                  </p>
                </button>
              ) : currentTickets.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-white/40">
                  <Check size={28} className="opacity-50" />
                  <p className="text-sm">Aucun ticket en service</p>
                </div>
              ) : (
                <>
                  {currentTickets.map((t) => (
                    <ServingCard
                      key={t.id}
                      ticket={t}
                      now={now}
                      disabled={actionLoading}
                      hasWaiting={hasWaiting}
                      onComplete={onComplete}
                      onNoShow={onNoShow}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={onCallNext}
                    disabled={actionLoading || !hasWaiting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-white/60 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:bg-white/[0.02] disabled:hover:text-white/60"
                  >
                    <Plus size={16} />
                    Ajouter un siège
                  </button>
                </>
              )}
            </div>
            <ServingDropZone active={isDraggingWaiting} />
          </section>

          {/* Colonne 3 — Terminés aujourd'hui */}
          <section className="relative flex min-h-0 flex-col rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <History size={18} />
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  Terminés
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs font-bold text-white/70 tabular-nums">
                {stats?.totalToday ?? history.length}
              </span>
            </header>
            <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-1">
              {historyLoading ? (
                <div className="flex h-full items-center justify-center py-10 text-white/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-white/40">
                  <History size={28} className="opacity-50" />
                  <p className="text-sm">Aucun ticket traité aujourd'hui</p>
                </div>
              ) : (
                history.map((t) => {
                  const chip = statusChip(t.status);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white/80 tabular-nums">
                          n°{t.number}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${chip.className}`}
                        >
                          {chip.label}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <Clock size={11} />
                        {formatTime(t.completedAt ?? t.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <DoneDropZones active={isDraggingServing} />
          </section>
        </div>

        {/* Footer stats */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/40">En attente :</span>
            <span className="font-semibold text-violet-300 tabular-nums">
              {stats?.waiting ?? waitingTickets.length}
            </span>
          </span>
          <span className="text-white/20">|</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/40">Aujourd'hui :</span>
            <span className="font-semibold text-white/80 tabular-nums">
              {stats?.totalToday ?? 0}
            </span>
          </span>
          <span className="text-white/20">|</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/40">Attente moy. :</span>
            <span className="font-semibold text-emerald-300 tabular-nums">
              {avgWaitMin} min
            </span>
          </span>
          <span className="text-white/20">|</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/40">No-show :</span>
            <span className="font-semibold text-amber-300 tabular-nums">
              {Math.round(noShowRate)}%
            </span>
          </span>
        </div>
      </div>

      <DragOverlay>
        {dragData ? (
          <div className="rounded-xl border border-violet-500/50 bg-violet-500/20 px-4 py-3 shadow-2xl backdrop-blur-sm">
            <div className="text-2xl font-bold text-white tabular-nums">
              n°{dragData.ticket.number}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
