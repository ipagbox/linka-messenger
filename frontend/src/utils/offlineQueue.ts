export interface QueuedMessage {
  id: string
  roomId: string
  body: string
  timestamp: number
}

const DB_NAME = 'linka-offline'
const STORE_NAME = 'message-queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function enqueueMessage(message: QueuedMessage): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(message)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function dequeueAll(): Promise<QueuedMessage[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getRequest = store.getAll()
    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const items = getRequest.result as QueuedMessage[]
      store.clear()
      resolve(items.sort((a, b) => a.timestamp - b.timestamp))
    }
  })
}
