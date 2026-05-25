import { openDB } from 'idb'
import type { IDBPDatabase } from 'idb'
import type { Keymap } from '../types/keymap'

const DB_NAME = 'banime40-remap'
const DB_VERSION = 1
const STORE = 'keymaps'

interface Schema {
  [STORE]: {
    key: string
    value: Keymap
  }
}

let dbInstance: IDBPDatabase<Schema> | null = null

async function getDB(): Promise<IDBPDatabase<Schema>> {
  if (!dbInstance) {
    dbInstance = await openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      },
    })
  }
  return dbInstance
}

export async function saveKeymap(keymap: Keymap): Promise<void> {
  const db = await getDB()
  await db.put(STORE, { ...keymap, updatedAt: Date.now() })
}

export async function loadKeymap(id: string): Promise<Keymap | undefined> {
  const db = await getDB()
  return db.get(STORE, id)
}

export async function listKeymaps(): Promise<Keymap[]> {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function deleteKeymap(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}
