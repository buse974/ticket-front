import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getProfessionalQueue,
  getQueueStats,
  completeTicket,
  markNoShow,
  callNextTicket,
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
  Check,
  X,
  Users,
  Ticket as TicketIcon,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export default function QueueDashboardPage() {
  const navigate = useNavigate();
  const { queueId: queueIdParam } = useParams<{ queueId: string }>();
  const queueId = Number(queueIdParam);
  const { isAuthenticated } = useAuthStore();

  const [queue, setQueue] = useState<ProfessionalQueue["queue"] | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

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
      setCurrentTicket(queueData.currentTicket);
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

  const handleAction = async (
    action: (id: number) => Promise<any>,
    successMessage: string,
  ) => {
    if (isNaN(queueId)) return;
    setActionLoading(true);
    try {
      const result = await action(queueId);
      if (result.currentTicket !== undefined)
        setCurrentTicket(result.currentTicket);
      if (result.stats) setStats(result.stats);
      toast.success(successMessage);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = () => handleAction(completeTicket, "Client traité !");
  const handleNoShow = () => handleAction(markNoShow, "Client marqué absent");
  const handleCallNext = () =>
    handleAction(callNextTicket, "Ticket suivant appelé !");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <p className="text-gray-400 text-sm mt-1">
              Gérez cette file d'attente en temps réel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/qrcode/${queue.id}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
          </Link>
          <Link to={`/display/${queue.id}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 gap-2"
            >
              <Monitor className="w-4 h-4" />
              Écran
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.waiting || 0}
              </p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <TicketIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.totalToday || 0}
              </p>
              <p className="text-xs text-gray-500">Aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.avgWaitTime || 0}
                <span className="text-sm font-normal text-gray-500">min</span>
              </p>
              <p className="text-xs text-gray-500">Attente moy.</p>
            </div>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10">
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats?.noShowRate || 0}
                <span className="text-sm font-normal text-gray-500">%</span>
              </p>
              <p className="text-xs text-gray-500">No-show</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current ticket + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current ticket card */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Ticket en cours</h2>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Current number display */}
                <div className="flex-shrink-0 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur-2xl opacity-30" />
                    <div className="relative w-32 h-32 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                      <span className="text-6xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                        {currentTicket?.number || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex-1 w-full space-y-3">
                  {currentTicket ? (
                    <>
                      <button
                        onClick={handleComplete}
                        disabled={actionLoading}
                        className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-emerald-500 to-green-500 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                      >
                        <div className="relative flex items-center justify-center gap-3 bg-[#09090B] rounded-2xl px-6 py-4 group-hover:bg-emerald-500/10 transition-colors">
                          <Check className="w-5 h-5" />
                          <span className="font-semibold text-lg">Terminé</span>
                        </div>
                      </button>
                      <button
                        onClick={handleNoShow}
                        disabled={actionLoading}
                        className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-amber-500 to-orange-500 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                      >
                        <div className="relative flex items-center justify-center gap-3 bg-[#09090B] rounded-2xl px-6 py-4 group-hover:bg-amber-500/10 transition-colors">
                          <X className="w-5 h-5" />
                          <span className="font-semibold text-lg">Absent</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading || waitingTickets.length === 0}
                      className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      <div className="relative flex items-center justify-center gap-3 bg-[#09090B] rounded-2xl px-6 py-5 group-hover:bg-violet-500/10 transition-colors">
                        <span className="font-semibold text-xl">
                          {waitingTickets.length > 0
                            ? "Appeler le suivant"
                            : "Aucun en attente"}
                        </span>
                        {waitingTickets.length > 0 && (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Waiting list */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">
                File d'attente{" "}
                <span className="text-gray-500 font-normal">
                  ({waitingTickets.length})
                </span>
              </h2>
            </div>
            <div className="p-4">
              {waitingTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Users className="w-7 h-7 text-gray-600" />
                  </div>
                  <p className="text-gray-500">Aucun ticket en attente</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                  {waitingTickets.map((ticket, index) => (
                    <div
                      key={ticket.id}
                      className={`relative group p-4 rounded-xl text-center transition-all duration-200 ${
                        index === 0
                          ? "bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30"
                          : "bg-white/[0.03] border border-white/5 hover:border-white/10"
                      }`}
                    >
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
                          </span>
                        </div>
                      )}
                      <div
                        className={`text-2xl font-bold ${
                          index === 0 ? "text-white" : "text-white/70"
                        }`}
                      >
                        {ticket.number}
                      </div>
                      {index === 0 && (
                        <div className="text-[10px] text-violet-300 mt-1 font-medium uppercase tracking-wide">
                          Suivant
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - Today's activity */}
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Résumé du jour</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Traités</span>
                <span className="text-white font-medium">
                  {stats?.completed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Absents</span>
                <span className="text-white font-medium">
                  {stats?.noShow || 0}
                </span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Temps service moy.</span>
                <span className="text-white font-medium">
                  {stats?.avgServiceTime || 0} min
                </span>
              </div>
              {stats?.estimatedEndTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Fin estimée</span>
                  <span className="text-violet-400 font-medium">
                    {new Date(stats.estimatedEndTime).toLocaleTimeString(
                      "fr-FR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-3">Astuce</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Affichez l'écran de file sur une TV pour informer vos clients du
              numéro en cours. Imprimez le QR code pour que vos clients puissent
              prendre un ticket facilement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
