import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getProfessionalQueue,
  getQueueStats,
  completeTicket,
  markNoShow,
  callNextTicket,
  callSpecificTicket,
  takeTicket,
  type ProfessionalQueue,
  type Ticket,
  type QueueStats,
} from "@/api/queue";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import {
  ArrowLeft,
  QrCode,
  Monitor,
  History,
  LayoutGrid,
  Tv,
  Activity,
  UserPlus,
} from "lucide-react";
import type { ViewMode, QueueViewProps } from "./views/types";
import QueueKanbanView from "./views/QueueKanbanView";
import QueueComptoirView from "./views/QueueComptoirView";
import QueueTimelineView from "./views/QueueTimelineView";

const VIEW_STORAGE_KEY = "qless:dashboard:view";

function readStoredView(): ViewMode {
  if (typeof window === "undefined") return "kanban";
  const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
  if (stored === "kanban" || stored === "comptoir" || stored === "timeline") {
    return stored;
  }
  return "kanban";
}

export default function QueueDashboardPage() {
  const navigate = useNavigate();
  const { queueId: queueIdParam } = useParams<{ queueId: string }>();
  const queueId = Number(queueIdParam);
  const { isAuthenticated } = useAuthStore();

  const [queue, setQueue] = useState<ProfessionalQueue["queue"] | null>(null);
  const [currentTickets, setCurrentTickets] = useState<Ticket[]>([]);
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState<ViewMode>(() => readStoredView());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const loadData = useCallback(async () => {
    if (isNaN(queueId)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [queueData, statsData] = await Promise.all([
        getProfessionalQueue(queueId),
        getQueueStats(queueId),
      ]);
      setQueue(queueData.queue);
      setCurrentTickets(queueData.currentTickets);
      setWaitingTickets(queueData.waitingTickets);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      toast.error("Erreur de chargement de la file d'attente.");
    } finally {
      setLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWsMessage = useCallback(
    (message: WSMessage) => {
      if (message.payload && message.payload.queueId === queueId) {
        loadData();
      }
    },
    [loadData, queueId],
  );

  useWebSocket({
    queueId: queueId || 0,
    onMessage: handleWsMessage,
  });

  const runAction = async (
    fn: () => Promise<{ stats?: QueueStats } | undefined>,
    successMessage: string,
  ) => {
    if (isNaN(queueId)) return;
    setActionLoading(true);
    try {
      const result = await fn();
      if (result?.stats) setStats(result.stats);
      toast.success(successMessage);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = (ticketId: number, withNext: boolean) =>
    runAction(
      () => completeTicket(queueId, ticketId, withNext),
      "Client traité !",
    );
  const handleNoShow = (ticketId: number, withNext: boolean) =>
    runAction(
      () => markNoShow(queueId, ticketId, withNext),
      "Client marqué absent",
    );
  const handleCallNext = () =>
    runAction(() => callNextTicket(queueId), "Ticket suivant appelé !");
  const handleCallSpecific = (ticketId: number) =>
    runAction(
      () => callSpecificTicket(queueId, ticketId),
      "Client appelé !",
    );

  const handleCreateManualTicket = async () => {
    if (isNaN(queueId)) return;
    setActionLoading(true);
    try {
      const ticket = await takeTicket(queueId);
      toast.success(`Ticket n°${ticket.number} créé`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">File d'attente non trouvée.</p>
        <Link
          to="/dashboard/queues"
          className="text-violet-400 hover:text-violet-300"
        >
          &larr; Retour aux files
        </Link>
      </div>
    );
  }

  const viewProps: QueueViewProps = {
    queue,
    currentTickets,
    waitingTickets,
    stats,
    actionLoading,
    onComplete: handleComplete,
    onNoShow: handleNoShow,
    onCallNext: handleCallNext,
    onCallSpecific: handleCallSpecific,
  };

  const views: { id: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: "kanban", label: "Kanban", icon: LayoutGrid },
    { id: "comptoir", label: "Comptoir", icon: Tv },
    { id: "timeline", label: "Timeline", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/queues"
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{queue.name}</h1>
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  queue.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                }`}
              >
                {queue.isActive ? "Ouverte" : "Fermée"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCreateManualTicket}
            disabled={actionLoading || !queue.isActive}
            title={
              queue.isActive
                ? "Créer un ticket manuellement (ex: client au téléphone)"
                : "File fermée"
            }
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau ticket</span>
          </button>

          {/* View switcher */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
            {views.map((v) => {
              const Icon = v.icon;
              const active = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  title={v.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/dashboard/${queue.id}/history`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 gap-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden md:inline">Historique</span>
              </Button>
            </Link>
            <Link to={`/qrcode/${queue.id}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden md:inline">QR</span>
              </Button>
            </Link>
            <Link to={`/display/${queue.id}`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 gap-2"
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline">Écran</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active view */}
      {view === "kanban" && <QueueKanbanView {...viewProps} />}
      {view === "comptoir" && <QueueComptoirView {...viewProps} />}
      {view === "timeline" && <QueueTimelineView {...viewProps} />}
    </div>
  );
}
