import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyQueues, createQueue, type QueueWithStats } from "@/api/queue";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const IconUsers = ({ className }: { className: string }) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconTicket = ({ className }: { className: string }) => (
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
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
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

export default function QueuesListPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [queues, setQueues] = useState<QueueWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewQueueInput, setShowNewQueueInput] = useState(false);
  const [newQueueName, setNewQueueName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const loadQueues = useCallback(async () => {
    try {
      const data = await getMyQueues();
      setQueues(data);
    } catch (error) {
      toast.error("Erreur de chargement des files d'attente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadQueues();
    }
  }, [isAuthenticated, loadQueues]);

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return;
    try {
      await createQueue(newQueueName);
      toast.success("File créée !");
      setNewQueueName("");
      setShowNewQueueInput(false);
      loadQueues();
    } catch (error: any) {
      if (error.upgrade) {
        toast.error("Passez au plan Pro pour créer plus de files");
      } else {
        toast.error("Erreur de création");
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files d'attente</h1>
          <p className="text-gray-400">
            Gérez vos files d'attente et visualisez leur statut.
          </p>
        </div>
        <Button onClick={() => setShowNewQueueInput(!showNewQueueInput)}>
          {showNewQueueInput ? "Annuler" : "Nouvelle file"}
        </Button>
      </div>

      {showNewQueueInput && (
        <div className="p-4 bg-[#1C1917] rounded-lg mb-6 space-y-3">
          <input
            type="text"
            value={newQueueName}
            onChange={(e) => setNewQueueName(e.target.value)}
            placeholder="Nom de la nouvelle file..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreateQueue()}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={handleCreateQueue}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Créer la file
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {queues.map((queue) => (
          <div
            key={queue.id}
            className="bg-[#1C1917] border border-gray-800 rounded-lg transition-colors duration-200"
          >
            <Link
              to={`/dashboard/${queue.id}`}
              className="block p-4 hover:bg-gray-800/50 rounded-t-lg"
            >
              <div className="flex justify-between items-start">
                <h2 className="font-semibold text-lg text-white">
                  {queue.name}
                </h2>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    queue.isActive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {queue.isActive ? "Ouverte" : "Fermée"}
                </span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400 mt-3">
                <div className="flex items-center gap-2">
                  <IconUsers className="w-4 h-4" />
                  <span>
                    {queue.stats.waiting}{" "}
                    <span className="hidden sm:inline">en attente</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconTicket className="w-4 h-4" />
                  <span>
                    {queue.stats.totalToday}{" "}
                    <span className="hidden sm:inline">
                      tickets aujourd'hui
                    </span>
                  </span>
                </div>
              </div>
            </Link>
            <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-2 px-2 pb-2">
              <Link to={`/qrcode/${queue.id}`} className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800/60 justify-center gap-2"
                >
                  <IconQrCode className="w-4 h-4" />
                  QR Code
                </Button>
              </Link>
              <Link to={`/display/${queue.id}`} className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-gray-800/60 justify-center gap-2"
                >
                  <IconTv className="w-4 h-4" />
                  Écran
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
