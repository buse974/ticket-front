import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getQueueBySlug,
  takeTicket,
  type QueueInfo,
  type TicketInfo,
} from "@/api/queue";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { useQueueStore, loadTicketFromStorage } from "@/stores/queueStore";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export default function QueuePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [queueId, setQueueId] = useState<number | null>(null);

  const { queueInfo, setQueueInfo, myTicket, setMyTicket, updateFromWs } =
    useQueueStore();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);

  // Load queue info
  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const info = await getQueueBySlug(slug);
        setQueueInfo(info);
        setQueueId(info.id);

        // Check for existing ticket in localStorage
        const stored = loadTicketFromStorage();
        if (stored && stored.queueId === info.id) {
          setMyTicket(stored);
        }
      } catch (error) {
        toast.error("File introuvable");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, setQueueInfo, setMyTicket]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback(
    (message: WSMessage) => {
      if (message.type === "queue:update" && message.payload) {
        updateFromWs(message.payload as Partial<QueueInfo>);
      }
      if (message.type === "ticket:called" && message.payload) {
        const payload = message.payload as Partial<TicketInfo>;
        if (myTicket && payload.id === myTicket.id) {
          setMyTicket({ ...myTicket, status: "current", position: null });
          toast.success("C'est votre tour !");
        }
      }
    },
    [updateFromWs, myTicket, setMyTicket],
  );

  useWebSocket({
    queueId: queueId ?? 0,
    onMessage: handleWsMessage,
    enabled: queueId !== null,
  });

  // Handle take ticket
  const handleTakeTicket = async () => {
    if (!queueId) return;
    setTaking(true);
    try {
      let pushSubscription: string | undefined;
      if (isSupported && permission !== "granted") {
        await requestPermission();
      }

      const ticket = await takeTicket(queueId, pushSubscription);
      setMyTicket(ticket);
      toast.success(`Ticket n°${ticket.number} obtenu !`);
      navigate(`/queue/${queueId}/ticket/${ticket.id}`);
    } catch (error) {
      toast.error("Erreur lors de la prise du ticket");
      console.error(error);
    } finally {
      setTaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!queueInfo) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">File introuvable</h1>
          <p className="text-muted-foreground">
            Cette file d'attente n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            File active
          </div>
        </div>

        {/* Main number display */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-card rounded-3xl p-8 shadow-xl">
            <p className="text-center text-muted-foreground text-sm mb-2">
              Numéro en cours
            </p>
            <div className="text-center">
              <span className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent ticket-number">
                {queueInfo.currentNumber || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 gap-4 animate-slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-foreground">
              {queueInfo.waitingCount}
            </div>
            <div className="text-sm text-muted-foreground mt-1">en attente</div>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-foreground">
              {queueInfo.nextTicket}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              prochain ticket
            </div>
          </div>
        </div>

        {/* Action area */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          {myTicket && myTicket.status === "waiting" ? (
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-3xl blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-3xl p-6 text-center">
                <p className="text-muted-foreground text-sm mb-1">
                  Votre ticket
                </p>
                <div className="text-6xl font-bold text-primary ticket-number mb-2">
                  {myTicket.number}
                </div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                  Position : {myTicket.position}
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() =>
                    navigate(`/queue/${queueId}/ticket/${myTicket.id}`)
                  }
                >
                  Voir mon ticket
                </Button>
              </div>
            </div>
          ) : myTicket && myTicket.status === "current" ? (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-success rounded-3xl p-8 text-center text-white">
                <div className="text-2xl font-bold mb-2">
                  🎉 C'est votre tour !
                </div>
                <div className="text-7xl font-bold ticket-number mb-4">
                  {myTicket.number}
                </div>
                <p className="text-white/80">Présentez-vous maintenant</p>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-16 text-xl rounded-2xl bg-gradient-primary hover:opacity-90 transition-all shadow-lg shadow-primary/25"
              onClick={handleTakeTicket}
              disabled={taking}
            >
              {taking ? (
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Chargement...
                </span>
              ) : (
                "Prendre un ticket"
              )}
            </Button>
          )}
        </div>

        {/* Info */}
        <p
          className="text-center text-muted-foreground text-sm animate-slide-up"
          style={{ animationDelay: "300ms" }}
        >
          Vous serez notifié quand votre tour approche
        </p>
      </div>
    </div>
  );
}
