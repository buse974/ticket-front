import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProfessionalQueue } from "@/api/queue";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket, type WSMessage } from "@/hooks/useWebSocket";

export default function DisplayPage() {
  const navigate = useNavigate();
  const { queueId: queueIdParam } = useParams<{ queueId: string }>();
  const { isAuthenticated } = useAuthStore();
  const [queueName, setQueueName] = useState<string>("");
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [queueId, setQueueId] = useState<number | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!queueIdParam) {
      navigate("/dashboard");
      return;
    }

    const id = parseInt(queueIdParam, 10);
    setQueueId(id);

    async function load() {
      try {
        const data = await getProfessionalQueue(id);
        setQueueName(data.queue.name);
        setCurrentNumber(data.currentTicket?.number || null);
        setWaitingCount(data.waitingTickets.length);
        if (data.waitingTickets.length > 0) {
          setNextNumber(data.waitingTickets[0].number);
        } else {
          setNextNumber(null);
        }
      } catch (error) {
        console.error(error);
      }
    }
    load();
  }, [isAuthenticated, navigate, queueIdParam]);

  // WebSocket
  const handleWsMessage = useCallback(
    (message: WSMessage) => {
      if (message.type === "queue:update" || message.type === "ticket:called") {
        if (!queueId) return;
        getProfessionalQueue(queueId).then((data) => {
          setCurrentNumber(data.currentTicket?.number || null);
          setWaitingCount(data.waitingTickets.length);
          if (data.waitingTickets.length > 0) {
            setNextNumber(data.waitingTickets[0].number);
          } else {
            setNextNumber(null);
          }
        });
      }
    },
    [queueId],
  );

  useWebSocket({
    queueId: queueId || 0,
    onMessage: handleWsMessage,
  });

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-fuchsia-900 flex flex-col items-center justify-center p-8 cursor-pointer"
      onClick={toggleFullscreen}
    >
      {/* Logo & Queue name */}
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-bold text-white text-2xl">
          B
        </div>
        <span className="text-white/80 text-xl font-medium">{queueName}</span>
      </div>

      {/* Current number */}
      <div className="text-center mb-12">
        <p className="text-white/60 text-2xl md:text-3xl mb-4">
          Numero en cours
        </p>
        <div className="text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-fuchsia-300 text-[12rem] md:text-[16rem] font-bold leading-none">
          {currentNumber || "-"}
        </div>
      </div>

      {/* Next and waiting */}
      <div className="flex gap-16 md:gap-32">
        <div className="text-center">
          <p className="text-white/50 text-lg md:text-xl mb-2">Suivant</p>
          <div className="text-white/80 text-6xl md:text-8xl font-semibold">
            {nextNumber || "-"}
          </div>
        </div>
        <div className="text-center">
          <p className="text-white/50 text-lg md:text-xl mb-2">En attente</p>
          <div className="text-white/80 text-6xl md:text-8xl font-semibold">
            {waitingCount}
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 text-white/30 text-sm">
        Cliquez pour mode plein ecran
      </p>
    </div>
  );
}
