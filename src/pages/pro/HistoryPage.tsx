import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  Timer,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import {
  getProfessionalQueue,
  getQueueStatsRange,
  getQueueHistory,
  type StatsPeriod,
  type StatsRange,
  type QueueHistory,
  type HistoricTicket,
} from "@/api/queue";

const PAGE_SIZE = 50;

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayLabel(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

const STATUS_STYLES: Record<
  HistoricTicket["status"],
  { label: string; cls: string }
> = {
  waiting: {
    label: "En attente",
    cls: "bg-gray-500/10 text-gray-300 border-gray-500/20",
  },
  current: {
    label: "En cours",
    cls: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  },
  completed: {
    label: "Traité",
    cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  no_show: {
    label: "Absent",
    cls: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  cancelled: {
    label: "Annulé",
    cls: "bg-red-500/10 text-red-300 border-red-500/20",
  },
};

interface KpiProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function Kpi({ title, value, icon: Icon, iconColor, iconBg }: KpiProps) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { queueId: queueIdParam } = useParams<{ queueId: string }>();
  const queueId = Number(queueIdParam);
  const navigate = useNavigate();
  const { isAuthenticated, isInitialized } = useAuthStore();

  const [queueName, setQueueName] = useState<string>("");
  const [period, setPeriod] = useState<StatsPeriod>("7d");
  const [stats, setStats] = useState<StatsRange | null>(null);
  const [history, setHistory] = useState<QueueHistory | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const loadAll = useCallback(
    async (p: StatsPeriod, pageOffset: number) => {
      if (isNaN(queueId)) return;
      setLoading(true);
      try {
        const [queueData, statsData, historyData] = await Promise.all([
          getProfessionalQueue(queueId),
          getQueueStatsRange(queueId, p),
          getQueueHistory(queueId, p, {
            limit: PAGE_SIZE,
            offset: pageOffset,
          }),
        ]);
        setQueueName(queueData.queue.name);
        setStats(statsData);
        setHistory(historyData);
      } catch (error) {
        console.error(error);
        toast.error("Erreur de chargement de l'historique.");
      } finally {
        setLoading(false);
      }
    },
    [queueId],
  );

  useEffect(() => {
    if (isAuthenticated) loadAll(period, offset);
  }, [isAuthenticated, period, offset, loadAll]);

  const handlePeriodChange = (p: StatsPeriod) => {
    setOffset(0);
    setPeriod(p);
  };

  const chartData = (stats?.daily ?? []).map((d) => ({
    date: formatDayLabel(d.date),
    completed: d.completed,
    noShow: d.noShow,
    cancelled: d.cancelled,
    avgWaitMin: Math.round(d.avgWaitTime / 60),
    avgServiceMin: Math.round(d.avgServiceTime / 60),
  }));

  const totals = stats?.totals;
  const totalPages = history ? Math.ceil(history.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  if (loading && !stats) {
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
        <div className="flex items-center gap-4">
          <Link
            to={`/dashboard/${queueId}`}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Historique — {queueName}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Analyse des tickets passés et tendances.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(["7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p === "7d" ? "7 jours" : "30 jours"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Kpi
          title="Tickets"
          value={totals?.totalTickets ?? 0}
          icon={TicketIcon}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <Kpi
          title="Traités"
          value={totals?.completed ?? 0}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <Kpi
          title="Absents"
          value={totals?.noShow ?? 0}
          icon={XCircle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <Kpi
          title="Annulés"
          value={totals?.cancelled ?? 0}
          icon={Ban}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        />
        <Kpi
          title="Attente moy."
          value={
            totals ? `${Math.round(totals.avgWaitTime / 60)} min` : "0 min"
          }
          icon={Clock}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <Kpi
          title="No-show"
          value={`${totals?.noShowRate ?? 0}%`}
          icon={Percent}
          iconColor="text-fuchsia-400"
          iconBg="bg-fuchsia-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Tickets par jour</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0f",
                    border: "1px solid #ffffff20",
                    borderRadius: "0.75rem",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="completed"
                  stackId="s"
                  name="Traités"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="noShow"
                  stackId="s"
                  name="Absents"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="cancelled"
                  stackId="s"
                  name="Annulés"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">
            Temps moyens par jour (min)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0f",
                    border: "1px solid #ffffff20",
                    borderRadius: "0.75rem",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="avgWaitMin"
                  name="Attente"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgServiceMin"
                  name="Service"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-violet-400" />
            Tickets récents
            <span className="text-gray-500 font-normal text-sm">
              ({history?.total ?? 0})
            </span>
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={offset === 0 || loading}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {history && history.tickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun ticket sur cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">N°</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Statut</th>
                  <th className="text-left px-6 py-3 font-medium">Attente</th>
                  <th className="text-left px-6 py-3 font-medium">Service</th>
                  <th className="text-left px-6 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history?.tickets.map((t) => {
                  const s = STATUS_STYLES[t.status];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-3 font-semibold text-white">
                        {t.number}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {formatDateShort(t.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {formatDuration(t.waitTime)}
                      </td>
                      <td className="px-6 py-3 text-gray-300">
                        {formatDuration(t.serviceTime)}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {t.isRemote ? "À distance" : "Sur place"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
