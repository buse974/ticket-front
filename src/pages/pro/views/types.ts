import type { Ticket, QueueStats } from "@/api/queue";

export type ViewMode = "kanban" | "comptoir" | "timeline";

export interface QueueViewProps {
  queue: {
    id: number;
    name: string;
    isActive: boolean;
    slug?: string;
  };
  currentTickets: Ticket[];
  waitingTickets: Ticket[];
  stats: QueueStats | null;
  actionLoading: boolean;
  onComplete: (ticketId: number, withNext: boolean) => void;
  onNoShow: (ticketId: number, withNext: boolean) => void;
  onCallNext: () => void;
  onCallSpecific: (ticketId: number) => void;
}
