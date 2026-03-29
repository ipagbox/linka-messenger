export interface User {
  id: number
  matrix_user_id: string
  display_name: string
  is_admin: boolean
}

export interface Circle {
  id: number
  name: string
  matrix_space_id: string | null
  matrix_general_room_id: string | null
  matrix_announcements_room_id: string | null
  max_members: number
  member_count: number
  creator: { id: number; display_name: string } | null
  created_at: string
}

export interface Invite {
  id: number
  max_uses: number
  uses_count: number
  expires_at: string | null
  created_at: string
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderName: string
  body: string
  msgtype: string
  timestamp: number
  status: 'composing' | 'sending' | 'sent' | 'error'
  content?: MessageContent
}

export interface MessageContent {
  body: string
  msgtype: string
  url?: string
  filename?: string
  info?: {
    mimetype?: string
    size?: number
    w?: number
    h?: number
    thumbnail_url?: string
  }
}

export interface ChatRoom {
  id: string
  name: string
  topic?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
  isDM: boolean
  isGeneral: boolean
  isAnnouncements: boolean
  circleId?: string
  members?: string[]
  isPinned?: boolean
}

export interface LoginCredentials {
  matrix_user_id: string
  access_token: string
  device_id: string
  rails_token: string
}

export interface OnboardingResult {
  matrix_user_id: string
  access_token: string
  device_id: string
  rails_token: string
}
