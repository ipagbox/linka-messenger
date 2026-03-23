import { create } from 'zustand'

type CallState = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended'

interface CallStoreState {
  activeCall: unknown | null
  callState: CallState
  isMuted: boolean
  isVideoMuted: boolean
  callRoomId: string | null

  setCall: (call: unknown | null) => void
  setCallState: (state: CallState) => void
  setMuted: (muted: boolean) => void
  setVideoMuted: (muted: boolean) => void
  toggleMute: () => void
  toggleVideo: () => void
  hangUp: () => void
  startCall: (roomId: string, type: 'voice' | 'video') => Promise<void>
  answerCall: () => void
  rejectCall: () => void
}

export const useCallStore = create<CallStoreState>((set, get) => ({
  activeCall: null,
  callState: 'idle',
  isMuted: false,
  isVideoMuted: false,
  callRoomId: null,

  setCall: (call) => set({ activeCall: call }),
  setCallState: (state) => set({ callState: state }),
  setMuted: (muted) => set({ isMuted: muted }),
  setVideoMuted: (muted) => set({ isVideoMuted: muted }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoMuted: !state.isVideoMuted })),

  hangUp: () => {
    const { activeCall } = get()
    if (activeCall && typeof (activeCall as { hangup?: () => void }).hangup === 'function') {
      ;(activeCall as { hangup: () => void }).hangup()
    }
    set({ activeCall: null, callState: 'idle', callRoomId: null })
  },

  startCall: async (roomId, _type) => {
    set({ callState: 'connecting', callRoomId: roomId })
    // VoIP implementation via matrix-js-sdk
  },

  answerCall: () => {
    const { activeCall } = get()
    if (activeCall && typeof (activeCall as { answer?: () => void }).answer === 'function') {
      ;(activeCall as { answer: () => void }).answer()
    }
    set({ callState: 'connected' })
  },

  rejectCall: () => {
    const { activeCall } = get()
    if (activeCall && typeof (activeCall as { reject?: () => void }).reject === 'function') {
      ;(activeCall as { reject: () => void }).reject()
    }
    set({ activeCall: null, callState: 'idle', callRoomId: null })
  },
}))
