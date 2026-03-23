# Linka Messenger — Этап 5: Messaging + Этап 6: Files & Offline

## Контекст
Прочитай: `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/CODING_PLAN.md`

Этапы 1-4 завершены. Frontend с auth, circles, chat list готов. Теперь добавляем messaging и файлы.

## Задача
Реализовать полноценный чат с E2EE, файлами, offline-режимом.

## Что нужно сделать

### Часть A: Messaging (Этап 5)

#### Chat Store (`src/store/chatStore.ts`)
```typescript
interface ChatState {
  messages: Map<string, Message[]>  // roomId → messages[]
  pendingMessages: PendingMessage[]
  typingUsers: Map<string, string[]>  // roomId → userId[]
  isLoadingHistory: boolean

  sendMessage(roomId: string, body: string, msgtype?: string): Promise<void>
  loadHistory(roomId: string, limit?: number): Promise<void>
  setTyping(roomId: string, isTyping: boolean): void
  markRead(roomId: string, eventId: string): void
  retryMessage(localId: string): Promise<void>
}
```

Состояния сообщений:
```typescript
type MessageStatus = 'sending' | 'sent' | 'error'
interface Message {
  eventId: string
  roomId: string
  senderId: string
  senderName: string
  body: string
  msgtype: string  // m.text, m.image, m.file
  timestamp: number
  status?: MessageStatus
  localId?: string  // для pending
  content?: any  // для файлов: url, info, filename
}
```

Напиши тесты для всех операций store.

#### Matrix Messages (`src/matrix/messages.ts`)
```typescript
export function sendTextMessage(client: MatrixClient, roomId: string, body: string): Promise<void>
export function sendTyping(client: MatrixClient, roomId: string, isTyping: boolean): Promise<void>
export function sendReadReceipt(client: MatrixClient, roomId: string, eventId: string): Promise<void>
export function loadRoomHistory(client: MatrixClient, roomId: string, limit: number): Promise<Message[]>
export function subscribeToRoom(client: MatrixClient, roomId: string, callback: (msg: Message) => void): () => void
export function subscribeToTyping(client: MatrixClient, roomId: string, callback: (userIds: string[]) => void): () => void
```

Напиши тесты с моком matrix-js-sdk.

#### E2EE
В `src/matrix/client.ts` добавь:
```typescript
// При инициализации:
await client.initCrypto()
client.setCryptoTrustCrossSignedDevices(true)
// Auto-verify: принимать все верификации от того же пользователя
```

#### Компоненты чата

**ChatView** (`src/components/chat/ChatView.tsx`):
- Отображает messages для текущего roomId
- Infinite scroll вверх (loadHistory)
- Auto-scroll вниз при новом сообщении (если пользователь внизу)
- Header: имя чата, кнопки звонков (placeholder), info
- Typing indicator внизу

**MessageInput** (`src/components/chat/MessageInput.tsx`):
- textarea (auto-resize, max 5 строк)
- Отправка по Enter (Shift+Enter = новая строка)
- Кнопка отправки
- Кнопка прикрепления файла (placeholder, реализация в Этапе 6)
- Отправка typing event при вводе (debounce 3s)

**MessageBubble** (`src/components/chat/MessageBubble.tsx`):
- Стиль: НЕ пузыри. Минималистичные блоки:
  - Свои: правый край, акцентный цвет левого бордера
  - Чужие: левый край, серый левый бордер
- Имя отправителя (для чужих, в group chats)
- Время (формат: HH:MM, или "вчера", или дата)
- Статус: sending (spinner), sent (галочка), error (красный + retry)
- Контекстное меню: копировать, retry (для error)

**TypingIndicator** (`src/components/chat/TypingIndicator.tsx`):
- "User typing..." или "User1, User2 typing..."
- Анимация трёх точек

**ReadReceipt** — в каждом MessageBubble:
- Показывать мини-аватары пользователей, которые прочитали (для своих сообщений)

Напиши тесты для каждого компонента.

#### Integration
- Подключи ChatView к роутеру: `/chat/:roomId`
- Клик по чату в ChatList → навигация → загрузка сообщений
- Новые сообщения через Matrix sync появляются в реальном времени
- Unread count обновляется в ChatList

### Часть B: Файлы и медиа (Этап 6)

#### Matrix Media (`src/matrix/media.ts`)
```typescript
export function uploadFile(client: MatrixClient, file: File): Promise<{ mxcUrl: string }>
export function getMediaUrl(client: MatrixClient, mxcUrl: string): string
export function getThumbnailUrl(client: MatrixClient, mxcUrl: string, width: number, height: number): string
```

#### MediaUpload (`src/components/media/MediaUpload.tsx`)
- Кнопка "Attach" в MessageInput
- File picker (images, files)
- Drag-and-drop на ChatView
- Preview перед отправкой (для изображений)
- Progress bar при загрузке
- Валидация размера (из серверных настроек)

#### ImagePreview (`src/components/media/ImagePreview.tsx`)
- Thumbnail в сообщении (max 300x300)
- Клик → lightbox (полный размер)
- Lightbox: overlay, close, zoom

#### FileAttachment (`src/components/media/FileAttachment.tsx`)
- Иконка типа файла
- Имя файла
- Размер (human-readable: KB, MB)
- TTL badge: "expires in N days" (считается от timestamp + server media.retention_days)
- Кнопка скачивания

#### Отправка файлов
В MessageInput:
1. User выбирает файл
2. Проверка размера (клиент)
3. Upload через matrix-js-sdk
4. Отправка m.room.message с msgtype `m.image` или `m.file`
5. Content: `{ url: mxcUrl, info: { size, mimetype, w, h }, body: filename }`

В MessageBubble — рендеринг по msgtype:
- `m.text` → текст
- `m.image` → ImagePreview
- `m.file` → FileAttachment

### Часть C: Offline (Этап 6)

#### Service Worker (`public/sw.js`)
```javascript
const CACHE_NAME = 'linka-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

// Install: cache app shell
// Activate: clean old caches
// Fetch: cache-first for static, network-first for API
```

Зарегистрируй в `src/main.tsx`:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
```

#### Offline Queue (`src/utils/offlineQueue.ts`)
```typescript
interface QueuedMessage {
  id: string
  roomId: string
  body: string
  msgtype: string
  timestamp: number
  file?: File
}

class OfflineQueue {
  async enqueue(message: QueuedMessage): Promise<void>  // IndexedDB
  async dequeue(): Promise<QueuedMessage | null>
  async flush(sendFn: (msg: QueuedMessage) => Promise<void>): Promise<void>
  async getAll(): Promise<QueuedMessage[]>
  async clear(): Promise<void>
}
```

#### Online Status Hook
```typescript
// src/hooks/useOnlineStatus.ts
function useOnlineStatus(): { isOnline: boolean; wasOffline: boolean }
// Слушает online/offline events
// При reconnect → flush offline queue
```

#### UI для offline
- Баннер вверху: "You are offline. Messages will be sent when connection is restored."
- Pending messages показываются с иконкой часов
- При reconnect: баннер убирается, pending → sending → sent

### Часть D: Backend — Media Cleanup (Этап 6)

#### MediaCleanupService (`backend/app/services/media_cleanup_service.rb`)
```ruby
class MediaCleanupService
  def cleanup_expired
    retention_days = ServerSetting.get('media.retention_days')
    return if retention_days == 0

    cutoff = retention_days.days.ago
    # Call Synapse Admin API to purge media older than cutoff
    # DELETE /_synapse/admin/v1/media/{server_name}/delete?before_ts={timestamp}
  end
end
```

#### Cleanup Job
```ruby
# app/jobs/cleanup_media_job.rb
class CleanupMediaJob < ApplicationJob
  def perform
    MediaCleanupService.new.cleanup_expired
  end
end
```

Cron/recurring: настрой через `config/initializers/scheduler.rb` (simple thread or Active Job + whenever).

Напиши тесты для сервиса и job.

## Definition of Done
- [ ] Текстовые сообщения отправляются и отображаются
- [ ] Chat store покрыт тестами
- [ ] MessageBubble рендерит все состояния (sent, pending, error)
- [ ] Typing indicator работает
- [ ] Read receipts отображаются
- [ ] История загружается при scroll вверх
- [ ] Файлы загружаются, preview отображается
- [ ] Размер файла валидируется на клиенте
- [ ] TTL badge показывается на файлах
- [ ] Service Worker кэширует app shell
- [ ] Offline: сообщения ставятся в очередь
- [ ] Reconnect: очередь отправляется
- [ ] MediaCleanupService покрыт тестами
- [ ] `npm test -- --run` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `cd backend && bundle exec rspec` → 0 failures

## Коммиты
```
feat: stage 5 - messaging with E2EE, typing, read receipts
feat: stage 6 - file uploads, media preview, offline support
```
