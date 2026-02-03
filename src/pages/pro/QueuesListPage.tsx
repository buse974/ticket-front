import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getMyQueues, createQueue, type QueueWithStats } from "@/api/queue";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Users,
  Ticket,
  QrCode,
  Monitor,
  Plus,
  MoreHorizontal,
  Clock,
  TrendingUp,
  Search,
  LayoutGrid,
  List,
  X,
} from "lucide-react";

export default function QueuesListPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [queues, setQueues] = useState<QueueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredQueues = queues.filter((q) =>
    q.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Files d'attente</h1>
          <p className="text-gray-400 mt-1">
            Gérez vos files d'attente et visualisez leur statut.
          </p>
        </div>
        <Button
          onClick={() => setShowNewQueueInput(!showNewQueueInput)}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 gap-2"
        >
          {showNewQueueInput ? (
            <>
              <X className="w-4 h-4" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Nouvelle file
            </>
          )}
        </Button>
      </div>

      {/* New queue input */}
      {showNewQueueInput && (
        <div className="bg-white/[0.03] border border-violet-500/30 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              placeholder="Nom de la nouvelle file..."
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateQueue()}
            />
            <Button
              onClick={handleCreateQueue}
              className="bg-violet-600 hover:bg-violet-500 text-white px-6"
            >
              Créer
            </Button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une file..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="flex items-center bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queues */}
      {filteredQueues.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <Ticket className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery ? "Aucun résultat" : "Aucune file d'attente"}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery
              ? "Essayez un autre terme de recherche"
              : "Créez votre première file d'attente pour commencer"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowNewQueueInput(true)}
              variant="outline"
              className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une file
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredQueues.map((queue) => (
            <div
              key={queue.id}
              className="group bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300"
            >
              {/* Card header */}
              <Link
                to={`/dashboard/${queue.id}`}
                className="block p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        queue.isActive
                          ? "bg-emerald-400 shadow-lg shadow-emerald-400/30"
                          : "bg-gray-500"
                      }`}
                    />
                    <h3 className="font-semibold text-lg text-white group-hover:text-violet-300 transition-colors">
                      {queue.name}
                    </h3>
                  </div>
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

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-bold text-white">
                      {queue.stats.waiting}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      En attente
                    </p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Ticket className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-bold text-white">
                      {queue.stats.totalToday}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      Aujourd'hui
                    </p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-xl font-bold text-white">
                      {queue.stats.avgWaitTime || 0}
                      <span className="text-sm font-normal">m</span>
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      Attente moy.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Card actions */}
              <div className="flex items-center border-t border-white/5">
                <Link
                  to={`/qrcode/${queue.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-sm">QR Code</span>
                </Link>
                <div className="w-px h-8 bg-white/5" />
                <Link
                  to={`/display/${queue.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">Écran</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          {filteredQueues.map((queue, index) => (
            <div
              key={queue.id}
              className={`${index !== 0 ? "border-t border-white/5" : ""}`}
            >
              <div className="flex items-center p-4 hover:bg-white/[0.02] transition-colors">
                <Link
                  to={`/dashboard/${queue.id}`}
                  className="flex-1 flex items-center gap-4"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      queue.isActive
                        ? "bg-emerald-400 shadow-lg shadow-emerald-400/30"
                        : "bg-gray-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-white truncate">
                      {queue.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {queue.stats.waiting} en attente ·{" "}
                      {queue.stats.totalToday} tickets aujourd'hui
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-6 ml-4">
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>{queue.stats.noShowRate}% no-show</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{queue.stats.avgWaitTime || 0} min</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/qrcode/${queue.id}`}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/display/${queue.id}`}
                      className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Monitor className="w-4 h-4" />
                    </Link>
                    <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
