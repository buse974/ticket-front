import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getQueueBySlug,
  getQueueInfo,
  getTicketStatus,
  takeTicket,
  cancelTicket,
  type QueueInfo,
  type TicketInfo,
} from "@/api/queue";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { useQueueStore, loadTicketFromStorage } from "@/stores/queueStore";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

export default function QueuePage() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();

  const { queueInfo, setQueueInfo, myTicket, setMyTicket, updateFromWs } =
    useQueueStore();
  const { isSupported, permission, requestPermission } =
    usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [taking, setTaking] = useState(false);
  const [queueId, setQueueId] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Load queue info
  useEffect(() => {
    async function load() {
      if (!slug && !id) return;
      try {
        let info;
        if (slug) {
          info = await getQueueBySlug(slug);
        } else {
          info = await getQueueInfo(parseInt(id!, 10));
        }
        setQueueInfo(info);
        setQueueId(info.id);

        // Check for existing ticket in localStorage and verify with server
        const stored = loadTicketFromStorage();
        if (stored && stored.queueId === info.id) {
          try {
            const fresh = await getTicketStatus(info.id, stored.id);
            if (fresh.status === "completed" || fresh.status === "no_show" || fresh.status === "cancelled") {
              // Ticket is done, clear localStorage
              setMyTicket(null);
            } else {
              setMyTicket(fresh);
            }
          } catch {
            // Ticket no longer exists on server, clear it
            setMyTicket(null);
          }
        }
      } catch (error) {
        toast.error("File introuvable");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, id, setQueueInfo, setMyTicket]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback(
    (message: WSMessage) => {
      if (message.type === "queue:update" && message.payload) {
        updateFromWs(message.payload as Partial<QueueInfo>);

        // Update position if we have a waiting ticket
        if (myTicket && myTicket.status === "waiting") {
          const payload = message.payload as Partial<QueueInfo>;
          if (payload.currentNumber) {
            const newPosition = myTicket.number - payload.currentNumber;
            setMyTicket({
              ...myTicket,
              position: newPosition > 0 ? newPosition : 1,
            });
          }
        }
      }
      if (message.type === "ticket:called" && message.payload) {
        const payload = message.payload as Partial<TicketInfo>;
        if (myTicket && payload.id === myTicket.id) {
          setMyTicket({ ...myTicket, status: "current", position: null });
          toast.success("C'est votre tour !");
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      }
      if (message.type === "ticket:completed" && message.payload) {
        const payload = message.payload as Partial<TicketInfo>;
        if (myTicket && payload.id === myTicket.id) {
          setMyTicket({ ...myTicket, status: "completed" });
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
    } catch (error) {
      toast.error("Erreur lors de la prise du ticket");
      console.error(error);
    } finally {
      setTaking(false);
    }
  };

  // Handle cancel ticket
  const handleCancel = async () => {
    if (!queueId || !myTicket) return;
    setCancelling(true);
    try {
      await cancelTicket(queueId, myTicket.id);
      setMyTicket(null);
      setShowCancelConfirm(false);
      toast.success("Ticket annulé");
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  // Handle new ticket after done
  const handleNewTicket = () => {
    setMyTicket(null);
    setShowCancelConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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

  const isCurrent = myTicket?.status === "current";
  const isWaiting = myTicket?.status === "waiting";
  const isDone =
    myTicket?.status === "completed" ||
    myTicket?.status === "no_show" ||
    myTicket?.status === "cancelled";
  const hasTicket = myTicket && !isDone;

  return (
    <div className="min-h-screen bg-gradient-mesh p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header - queue name */}
        <div className="text-center pt-4 animate-slide-up">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            {queueInfo.name}
          </h1>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            File active
          </div>
        </div>

        {/* ========================== */}
        {/* STATE: Current - your turn */}
        {/* ========================== */}
        {isCurrent && (
          <div className="animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative bg-gradient-success rounded-3xl p-8 text-white overflow-hidden">
                {/* Confetti */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full animate-float"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="relative text-center">
                  <div className="text-2xl font-bold mb-4">
                    🎉 C'est votre tour !
                  </div>
                  <p className="text-white/70 text-sm mb-2">Votre numéro</p>
                  <div className="text-9xl font-bold ticket-number animate-number-pop">
                    {myTicket.number}
                  </div>
                  <p className="mt-6 text-white/90 font-medium">
                    Présentez-vous au guichet maintenant
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================== */}
        {/* STATE: Waiting - in line */}
        {/* ======================== */}
        {isWaiting && (
          <>
            {/* Ticket card */}
            <div className="animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-3xl blur-2xl opacity-20" />
                <div className="relative bg-card rounded-3xl p-8 shadow-xl">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-2">
                      Votre numéro
                    </p>
                    <div className="text-9xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent ticket-number">
                      {myTicket.number}
                    </div>
                    {myTicket.position && (
                      <div className="mt-6">
                        <div className="inline-flex items-center gap-3 bg-primary/10 rounded-full px-6 py-3">
                          <div className="flex items-center gap-1">
                            {[...Array(Math.min(myTicket.position, 5))].map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className="w-3 h-3 rounded-full bg-primary/30"
                                  style={{ opacity: 1 - i * 0.15 }}
                                />
                              ),
                            )}
                          </div>
                          <span className="text-primary font-semibold">
                            {myTicket.position === 1
                              ? "Vous êtes le prochain !"
                              : `${myTicket.position} personnes avant vous`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Queue stats */}
            <div
              className="grid grid-cols-2 gap-4 animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
                <div className="text-3xl font-bold text-foreground">
                  {queueInfo.currentNumber || "-"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  en cours
                </div>
              </div>
              <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
                <div className="text-3xl font-bold text-foreground">
                  {queueInfo.waitingCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  en attente
                </div>
              </div>
            </div>

            {/* Cancel */}
            <div
              className="animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors py-2"
                >
                  Annuler mon ticket
                </button>
              ) : (
                <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3">
                  <p className="text-sm text-foreground text-center">
                    Si vous annulez, vous devrez reprendre un ticket et repartir
                    en fin de file.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      Non, garder
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? "Annulation..." : "Oui, annuler"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification info */}
            <p className="text-center text-muted-foreground text-sm">
              Vous serez notifié quand votre tour approche
            </p>
          </>
        )}

        {/* ============================== */}
        {/* STATE: Done - ticket completed */}
        {/* ============================== */}
        {isDone && (
          <>
            <div className="animate-scale-in">
              <div className="bg-card rounded-3xl p-8 shadow-xl text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">✓</span>
                </div>
                <p className="text-muted-foreground mb-2">Ticket terminé</p>
                <div className="text-6xl font-bold text-muted-foreground ticket-number">
                  {myTicket!.number}
                </div>
              </div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
              <Button
                size="lg"
                className="w-full h-14 text-lg rounded-2xl bg-gradient-primary hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                onClick={handleNewTicket}
              >
                Prendre un nouveau ticket
              </Button>
            </div>
          </>
        )}

        {/* =============================== */}
        {/* STATE: No ticket - take one     */}
        {/* =============================== */}
        {!hasTicket && !isDone && (
          <>
            {/* Main number display */}
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-20" />
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
                <div className="text-sm text-muted-foreground mt-1">
                  en attente
                </div>
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

            {/* Take ticket button */}
            <div
              className="animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              <Button
                size="lg"
                className="w-full h-16 text-xl rounded-2xl bg-gradient-primary hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                onClick={handleTakeTicket}
                disabled={taking}
              >
                {taking ? (
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Chargement...
                  </span>
                ) : (
                  "Prendre un ticket"
                )}
              </Button>
            </div>

            {/* Info */}
            <p
              className="text-center text-muted-foreground text-sm animate-slide-up"
              style={{ animationDelay: "300ms" }}
            >
              Vous serez notifié quand votre tour approche
            </p>
          </>
        )}
      </div>
    </div>
  );
}
