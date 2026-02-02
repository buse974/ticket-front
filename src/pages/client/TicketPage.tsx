import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  getTicketStatus,
  getQueueInfo,
  type TicketInfo,
  type QueueInfo,
} from "@/api/queue";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";
import { useQueueStore } from "@/stores/queueStore";
import { toast } from "sonner";

export default function TicketPage() {
  const { id, ticketId } = useParams<{ id: string; ticketId: string }>();
  const navigate = useNavigate();
  const queueId = Number(id);
  const tId = Number(ticketId);

  const { queueInfo, setQueueInfo, myTicket, setMyTicket } = useQueueStore();
  const [loading, setLoading] = useState(true);

  // Load ticket and queue info
  useEffect(() => {
    async function load() {
      try {
        const [ticket, queue] = await Promise.all([
          getTicketStatus(queueId, tId),
          getQueueInfo(queueId),
        ]);
        setMyTicket(ticket);
        setQueueInfo(queue);
      } catch (error) {
        toast.error("Ticket introuvable");
        console.error(error);
        navigate(`/queue/${queueId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [queueId, tId, setMyTicket, setQueueInfo, navigate]);

  // WebSocket for real-time updates
  const handleWsMessage = useCallback(
    (message: WSMessage) => {
      if (message.type === "queue:update" && message.payload) {
        const payload = message.payload as Partial<QueueInfo>;
        setQueueInfo({
          ...queueInfo!,
          ...payload,
        } as QueueInfo);
        if (
          myTicket &&
          myTicket.status === "waiting" &&
          payload.currentNumber
        ) {
          const newPosition = myTicket.number - payload.currentNumber;
          setMyTicket({
            ...myTicket,
            position: newPosition > 0 ? newPosition : 1,
          });
        }
      }
      if (message.type === "ticket:called" && message.payload) {
        const payload = message.payload as Partial<TicketInfo>;
        if (payload.id === tId) {
          setMyTicket({ ...myTicket!, status: "current", position: null });
          toast.success("C'est votre tour !");
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
      }
    },
    [queueInfo, myTicket, tId, setQueueInfo, setMyTicket],
  );

  useWebSocket({
    queueId,
    onMessage: handleWsMessage,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!myTicket) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎫</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Ticket introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Ce ticket n'existe pas ou a expiré.
          </p>
          <Button
            className="rounded-xl"
            onClick={() => navigate(`/queue/${queueId}`)}
          >
            Retour à la file
          </Button>
        </div>
      </div>
    );
  }

  const isCurrent = myTicket.status === "current";
  const isDone =
    myTicket.status === "completed" || myTicket.status === "no_show";

  return (
    <div className="min-h-screen bg-gradient-mesh p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Ticket Card */}
        <div className="animate-scale-in">
          {isCurrent ? (
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-success rounded-3xl p-8 text-white overflow-hidden">
                {/* Confetti effect */}
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
          ) : isDone ? (
            <div className="bg-card rounded-3xl p-8 shadow-xl text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>
              <p className="text-muted-foreground mb-2">Ticket terminé</p>
              <div className="text-6xl font-bold text-muted-foreground ticket-number">
                {myTicket.number}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-3xl blur-2xl opacity-20"></div>
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
          )}
        </div>

        {/* Queue status */}
        {queueInfo && !isDone && (
          <div
            className="grid grid-cols-2 gap-4 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <div className="bg-card rounded-2xl p-5 shadow-sm text-center">
              <div className="text-3xl font-bold text-foreground">
                {queueInfo.currentNumber || "-"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">en cours</div>
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
        )}

        {/* Actions */}
        <div
          className="space-y-3 animate-slide-up"
          style={{ animationDelay: "200ms" }}
        >
          {isDone && (
            <Button
              className="w-full rounded-xl h-12 bg-gradient-primary"
              onClick={() => {
                setMyTicket(null);
                navigate(`/queue/${queueId}`);
              }}
            >
              Prendre un nouveau ticket
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full rounded-xl h-12"
            onClick={() => navigate(`/queue/${queueId}`)}
          >
            Retour à la file
          </Button>
        </div>

        {/* Info */}
        {!isDone && !isCurrent && (
          <p className="text-center text-muted-foreground text-sm">
            🔔 Vous serez notifié quand ce sera votre tour
          </p>
        )}
      </div>
    </div>
  );
}
