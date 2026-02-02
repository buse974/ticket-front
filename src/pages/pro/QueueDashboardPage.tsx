import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getProfessionalQueue,
  completeTicket,
  markNoShow,
  callNextTicket,
  updateQueue,
  type ProfessionalQueue,
  type Ticket,
} from "@/api/queue";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { toast } from "sonner";

const IconUsers = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const IconCheck = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconX = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const IconLogout = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const IconQrCode = ({ className }: { className: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="5" height="5" x="3" y="3" rx="1" />
    <rect width="5" height="5" x="16" y="3" rx="1" />
    <rect width="5" height="5" x="3" y="16" rx="1" />
    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <path d="M21 21v.01" />
    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <path d="M3 12h.01" />
    <path d="M12 3h.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h1" />
    <path d="M21 12h.01" />
    <path d="M12 21h-1" />
  </svg>
);

const IconTv = ({ className }: { className: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

export default function QueueDashboardPage() {
  const navigate = useNavigate();
  const { queueId: queueIdParam } = useParams<{ queueId: string }>();
  const queueId = Number(queueIdParam);
  const { logout, isAuthenticated } = useAuthStore();

  const [queue, setQueue] = useState<ProfessionalQueue["queue"] | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([]);

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
      const queueData = await getProfessionalQueue(queueId);
      setQueue(queueData.queue);
      setCurrentTicket(queueData.currentTicket);
      setWaitingTickets(queueData.waitingTickets);
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

  const handleToggleRemoteBooking = async (current: boolean) => {
    if (isNaN(queueId)) return;
    try {
      await updateQueue(queueId, { allowRemoteBooking: !current });
      toast.success(
        !current
          ? "Réservation à distance activée"
          : "Réservation à distance désactivée",
      );
      setQueue((q) => (q ? { ...q, allowRemoteBooking: !current } : null));
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center">
          <p>File d'attente non trouvée.</p>
          <Link
            to="/dashboard"
            className="text-violet-400 hover:text-violet-300 mt-4 inline-block"
          >
            &larr; Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <header className="relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="text-white/60 hover:text-white">
              &larr; Retour
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/40 hover:text-white hover:bg-white/10"
            >
              <IconLogout />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">{queue.name}</h2>
              <div className="flex items-center gap-4">
                <Link to={`/qrcode/${queue.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-800/60 flex items-center gap-2"
                  >
                    <IconQrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </Button>
                </Link>
                <Link to={`/display/${queue.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-800/60 flex items-center gap-2"
                  >
                    <IconTv className="w-4 h-4" />
                    <span className="hidden sm:inline">Écran</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/40">
                    Réservation à distance
                  </span>
                  <button
                    onClick={() =>
                      handleToggleRemoteBooking(queue.allowRemoteBooking)
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      queue.allowRemoteBooking ? "bg-violet-600" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${
                        queue.allowRemoteBooking ? "left-6" : "left-1"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 text-center">
                  <div className="text-sm text-white/40 mb-2">En cours</div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur-2xl opacity-30"></div>
                    <div className="relative w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                      <span className="text-7xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                        {currentTicket?.number || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  {currentTicket ? (
                    <>
                      <button
                        onClick={handleComplete}
                        disabled={actionLoading}
                        className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-emerald-500 to-green-500 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <div className="relative flex items-center justify-center gap-3 bg-[#0a0a0f] rounded-2xl px-6 py-4 group-hover:bg-emerald-500/10 transition-colors">
                          <IconCheck />
                          <span className="font-semibold text-lg">Terminé</span>
                        </div>
                      </button>
                      <button
                        onClick={handleNoShow}
                        disabled={actionLoading}
                        className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-amber-500 to-orange-500 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <div className="relative flex items-center justify-center gap-3 bg-[#0a0a0f] rounded-2xl px-6 py-4 group-hover:bg-amber-500/10 transition-colors">
                          <IconX />
                          <span className="font-semibold text-lg">Absent</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCallNext}
                      disabled={actionLoading || waitingTickets.length === 0}
                      className="w-full group relative overflow-hidden rounded-2xl p-px bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      <div className="relative flex items-center justify-center gap-3 bg-[#0a0a0f] rounded-2xl px-6 py-5 group-hover:bg-violet-500/10 transition-colors">
                        <span className="font-semibold text-xl">
                          {waitingTickets.length > 0
                            ? "Appeler le suivant"
                            : "Aucun en attente"}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/5">
              <h2 className="font-semibold text-white">
                File d'attente{" "}
                <span className="ml-2 text-sm font-normal text-white/40">
                  ({waitingTickets.length})
                </span>
              </h2>
            </div>
            <div className="p-4">
              {waitingTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <IconUsers />
                  </div>
                  <p className="text-white/40">Aucun ticket en attente</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
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
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
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
                      {ticket.isRemote && (
                        <div className="text-[10px] text-violet-400 mt-1">
                          À distance
                        </div>
                      )}
                      {index === 0 && (
                        <div className="text-[10px] text-violet-300 mt-1 font-medium">
                          SUIVANT
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
