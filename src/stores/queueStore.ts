import { create } from 'zustand'
import type { QueueInfo, TicketInfo, Ticket } from '@/api/queue'

interface QueueState {
  // Client state
  queueInfo: QueueInfo | null
  myTicket: TicketInfo | null
  setQueueInfo: (info: QueueInfo) => void
  setMyTicket: (ticket: TicketInfo | null) => void
  updateFromWs: (data: Partial<QueueInfo>) => void

  // Professional state
  currentTicket: Ticket | null
  waitingTickets: Ticket[]
  setCurrentTicket: (ticket: Ticket | null) => void
  setWaitingTickets: (tickets: Ticket[]) => void
}

export const useQueueStore = create<QueueState>((set) => ({
  queueInfo: null,
  myTicket: null,
  currentTicket: null,
  waitingTickets: [],

  setQueueInfo: (info) => set({ queueInfo: info }),

  setMyTicket: (ticket) => {
    if (ticket) {
      localStorage.setItem('myTicket', JSON.stringify(ticket))
    } else {
      localStorage.removeItem('myTicket')
    }
    set({ myTicket: ticket })
  },

  updateFromWs: (data) =>
    set((state) => ({
      queueInfo: state.queueInfo ? { ...state.queueInfo, ...data } : null,
    })),

  setCurrentTicket: (ticket) => set({ currentTicket: ticket }),
  setWaitingTickets: (tickets) => set({ waitingTickets: tickets }),
}))

// Load ticket from localStorage on startup
export function loadTicketFromStorage(): TicketInfo | null {
  const stored = localStorage.getItem('myTicket')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem('myTicket')
    }
  }
  return null
}
