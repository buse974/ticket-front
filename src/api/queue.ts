import { apiClient } from "./client";

// Types
export type TicketStatus = "waiting" | "current" | "completed" | "no_show" | "cancelled";

export interface QueueInfo {
  id: number;
  name?: string;
  slug?: string;
  currentNumber: number;
  currentNumbers?: number[];
  nextTicket: number;
  waitingCount: number;
  isActive?: boolean;
  avgWaitTime?: number;
}

export interface QueueStats {
  totalToday: number;
  completed: number;
  noShow: number;
  waiting: number;
  noShowRate: number;
  avgWaitTime: number;
  avgServiceTime: number;
  estimatedEndTime: string | null;
}

export interface QueueWithStats extends QueueInfo {
  stats: QueueStats;
}

export interface TicketInfo {
  id: number;
  number: number;
  status: TicketStatus;
  position: number | null;
  queueId: number;
  estimatedWaitMinutes?: number | null;
}

export interface Ticket {
  id: number;
  number: number;
  status: TicketStatus;
  queueId: number;
  clientIp?: string;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface ProfessionalQueue {
  queue: {
    id: number;
    name: string;
    slug: string;
    currentNumber: number;
    nextTicket: number;
    isActive: boolean;
  };
  currentTickets: Ticket[];
  waitingTickets: Ticket[];
}

export interface QRCodeData {
  queueId: number;
  slug: string;
  name: string;
  url: string;
}

// Public APIs

export async function getQueueInfo(queueId: number): Promise<QueueInfo> {
  return apiClient<QueueInfo>(`/api/queue/${queueId}`);
}

export async function getQueueBySlug(
  slug: string,
): Promise<QueueInfo & { professionalName: string }> {
  return apiClient(`/api/queue/slug/${slug}`);
}

export async function takeTicket(
  queueId: number,
  pushSubscription?: string,
): Promise<TicketInfo> {
  return apiClient<TicketInfo>(`/api/queue/${queueId}/ticket`, {
    method: "POST",
    body: JSON.stringify({ pushSubscription }),
  });
}

export async function getTicketStatus(
  queueId: number,
  ticketId: number,
): Promise<TicketInfo> {
  return apiClient<TicketInfo>(`/api/queue/${queueId}/ticket/${ticketId}`);
}

// Authenticated APIs (Professional)

export async function getMyQueues(): Promise<QueueWithStats[]> {
  return apiClient<QueueWithStats[]>("/api/queue", { auth: true });
}

export async function createQueue(name: string): Promise<QueueInfo> {
  return apiClient<QueueInfo>("/api/queue", {
    method: "POST",
    body: JSON.stringify({ name }),
    auth: true,
  });
}

export async function updateQueue(
  queueId: number,
  updates: { name?: string; isActive?: boolean },
): Promise<void> {
  return apiClient(`/api/queue/${queueId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
    auth: true,
  });
}

export async function deleteQueue(queueId: number): Promise<void> {
  return apiClient(`/api/queue/${queueId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getQueueStats(queueId: number): Promise<QueueStats> {
  return apiClient<QueueStats>(`/api/queue/${queueId}/stats`, { auth: true });
}

// History & Range stats

export type StatsPeriod = "7d" | "30d";

export interface DailyStat {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
  noShow: number;
  cancelled: number;
  avgWaitTime: number; // seconds
  avgServiceTime: number; // seconds
}

export interface StatsRange {
  range: { from: string; to: string; period: StatsPeriod };
  totals: {
    totalTickets: number;
    completed: number;
    noShow: number;
    cancelled: number;
    avgWaitTime: number;
    avgServiceTime: number;
    noShowRate: number;
  };
  daily: DailyStat[];
}

export interface HistoricTicket {
  id: number;
  number: number;
  status: TicketStatus;
  createdAt: string;
  calledAt: string | null;
  completedAt: string | null;
  isRemote: boolean;
  waitTime: number | null; // seconds
  serviceTime: number | null; // seconds
}

export interface QueueHistory {
  tickets: HistoricTicket[];
  total: number;
  limit: number;
  offset: number;
}

export async function getQueueStatsRange(
  queueId: number,
  period: StatsPeriod,
): Promise<StatsRange> {
  return apiClient<StatsRange>(
    `/api/queue/${queueId}/stats?period=${period}`,
    { auth: true },
  );
}

export async function getQueueHistory(
  queueId: number,
  period: StatsPeriod,
  opts: { limit?: number; offset?: number } = {},
): Promise<QueueHistory> {
  const params = new URLSearchParams({ period });
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  return apiClient<QueueHistory>(
    `/api/queue/${queueId}/history?${params.toString()}`,
    { auth: true },
  );
}

export async function getQueueTickets(queueId: number): Promise<Ticket[]> {
  return apiClient<Ticket[]>(`/api/queue/${queueId}/tickets`, { auth: true });
}

export async function getProfessionalQueue(
  queueId: number,
): Promise<ProfessionalQueue> {
  return apiClient<ProfessionalQueue>(`/api/professional/queue/${queueId}`, {
    auth: true,
  });
}

// Actions sur la file

export async function completeTicket(
  queueId: number,
  ticketId: number,
  withNext: boolean,
): Promise<{
  completedTicket: Ticket;
  nextTicket: Ticket | null;
  stats: QueueStats;
}> {
  return apiClient(
    `/api/queue/${queueId}/ticket/${ticketId}/complete?next=${withNext}`,
    {
      method: "POST",
      auth: true,
    },
  );
}

export async function markNoShow(
  queueId: number,
  ticketId: number,
  withNext: boolean,
): Promise<{
  noShowTicket: Ticket;
  nextTicket: Ticket | null;
  stats: QueueStats;
}> {
  return apiClient(
    `/api/queue/${queueId}/ticket/${ticketId}/no-show?next=${withNext}`,
    {
      method: "POST",
      auth: true,
    },
  );
}

export async function callNextTicket(
  queueId: number,
): Promise<{ currentTicket: Ticket; stats: QueueStats }> {
  return apiClient(`/api/queue/${queueId}/call-next`, {
    method: "POST",
    auth: true,
  });
}

export async function resetQueue(queueId: number): Promise<void> {
  return apiClient(`/api/queue/${queueId}/reset`, {
    method: "POST",
    auth: true,
  });
}

export async function cancelTicket(
  queueId: number,
  ticketId: number,
): Promise<{ success: boolean }> {
  return apiClient(`/api/queue/${queueId}/ticket/${ticketId}/cancel`, {
    method: "POST",
  });
}

// QR Code & Push

export async function getQRCodeData(queueId: number): Promise<QRCodeData> {
  return apiClient<QRCodeData>(`/api/professional/queue/${queueId}/qrcode`, {
    auth: true,
  });
}

export async function getVapidKey(): Promise<{ publicKey: string }> {
  return apiClient("/api/professional/vapid-key", { auth: true });
}
