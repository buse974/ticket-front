import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getMyQueues, type QueueWithStats } from "@/api/queue";
import { getHourlyStats, type HourlyData } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  Users,
  Ticket,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ListTodo,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "il y a 1 min";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "il y a 1h";
  return `il y a ${hours}h`;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
}: StatsCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [queues, setQueues] = useState<QueueWithStats[]>([]);
  const [chartData, setChartData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [, setTick] = useState(0);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [queuesData, hourlyData] = await Promise.all([
        getMyQueues(),
        getHourlyStats(),
      ]);
      setQueues(queuesData);
      setChartData(hourlyData);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error("Erreur de chargement des données");
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Update "il y a X min" every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate aggregated stats
  const totalQueues = queues.length;
  const totalTicketsToday = queues.reduce(
    (sum, q) => sum + q.stats.totalToday,
    0,
  );
  const totalWaiting = queues.reduce((sum, q) => sum + q.stats.waiting, 0);
  const avgNoShowRate =
    queues.length > 0
      ? Math.round(
          queues.reduce((sum, q) => sum + q.stats.noShowRate, 0) /
            queues.length,
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vue d'ensemble</h1>
          <p className="text-gray-400 mt-1">
            Bienvenue ! Voici un résumé de votre activité.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">{timeAgo(lastUpdated)}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Files d'attente"
          value={totalQueues}
          icon={ListTodo}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
        />
        <StatsCard
          title="Tickets aujourd'hui"
          value={totalTicketsToday}
          icon={Ticket}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatsCard
          title="En attente"
          value={totalWaiting}
          icon={Users}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <StatsCard
          title="Taux no-show"
          value={`${avgNoShowRate}%`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
      </div>

      {/* Chart + Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Activité du jour
              </h2>
              <p className="text-sm text-gray-400">Tickets par heure</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm text-gray-400">
              <Activity className="w-4 h-4" />
              <span>{totalTicketsToday} tickets</span>
            </div>
          </div>
          <div className="h-64">
            {totalTicketsToday === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Aucun ticket aujourd'hui
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1f",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                    }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#a78bfa" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTickets)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Queue List */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Vos files</h2>
            <Link
              to="/dashboard/queues"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {queues.length === 0 ? (
              <div className="text-center py-8">
                <ListTodo className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune file créée</p>
                <Link
                  to="/dashboard/queues"
                  className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block"
                >
                  Créer une file
                </Link>
              </div>
            ) : (
              queues.slice(0, 5).map((queue) => (
                <Link
                  key={queue.id}
                  to={`/dashboard/${queue.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${queue.isActive ? "bg-emerald-400" : "bg-gray-500"}`}
                    />
                    <span className="font-medium text-white group-hover:text-violet-300 transition-colors">
                      {queue.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      <span className="text-white font-medium">
                        {queue.stats.waiting}
                      </span>{" "}
                      en attente
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Activité récente</h2>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Aujourd'hui</span>
          </div>
        </div>
        <div className="space-y-3">
          {queues.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucune activité récente
            </p>
          ) : (
            queues.slice(0, 3).map((queue) => (
              <div
                key={queue.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">
                    <span className="font-medium">{queue.stats.completed}</span>{" "}
                    tickets traités sur{" "}
                    <span className="text-violet-400">{queue.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {queue.stats.noShow} absents · Temps moyen:{" "}
                    {queue.stats.avgWaitTime || 0} min
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
