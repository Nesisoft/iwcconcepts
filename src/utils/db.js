// ── IndexedDB wrapper ───────────────────────────────────────────────────────
// Replaces localStorage for all form/submission/speaker/task data.
// Much larger storage limit and better suited for binary data (photo uploads).

const DB_NAME = 'iwc_db'
const DB_VERSION = 1
let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('forms')) {
        db.createObjectStore('forms', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('submissions')) {
        const s = db.createObjectStore('submissions', { keyPath: 'id' })
        s.createIndex('formId', 'formId', { unique: false })
      }
      if (!db.objectStoreNames.contains('speakers')) {
        db.createObjectStore('speakers', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'formId' })
      }
    }

    req.onsuccess = e => { _db = e.target.result; resolve(_db) }
    req.onerror = e => reject(e.target.error)
  })
}

export async function dbGetAll(store) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function dbGet(store, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function dbPut(store, item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function dbDelete(store, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function dbGetByIndex(store, indexName, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).index(indexName).getAll(value)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Migration to Supabase ─────────────────────────────────────────────────
// Called by the Database Setup page when user first connects Supabase.
// Reads all data from IndexedDB and upserts it into the Supabase tables.
export async function migrateToSupabase(sb, onProgress) {
  const report = { forms: 0, submissions: 0, speakers: 0, tasks: 0, errors: [] }

  try {
    // Forms
    const forms = await dbGetAll('forms')
    onProgress?.(`Migrating ${forms.length} forms…`)
    for (const form of forms) {
      const { error } = await sb.from('forms').upsert(
        { id: form.id, data: form, created_at: form.createdAt || new Date().toISOString() },
        { onConflict: 'id' }
      )
      if (error) report.errors.push(`form ${form.id}: ${error.message}`)
      else report.forms++
    }

    // Submissions
    const subs = await dbGetAll('submissions')
    onProgress?.(`Migrating ${subs.length} submissions…`)
    for (const sub of subs) {
      const { error } = await sb.from('submissions').upsert(
        { id: sub.id, form_id: sub.formId, data: sub, submitted_at: sub.timestamp || new Date().toISOString() },
        { onConflict: 'id' }
      )
      if (error) report.errors.push(`submission ${sub.id}: ${error.message}`)
      else report.submissions++
    }

    // Speakers
    const speakers = await dbGetAll('speakers')
    onProgress?.(`Migrating ${speakers.length} speakers…`)
    for (const sp of speakers) {
      const { error } = await sb.from('speakers').upsert(
        { id: sp.id, data: sp, created_at: sp.createdAt || new Date().toISOString() },
        { onConflict: 'id' }
      )
      if (error) report.errors.push(`speaker ${sp.id}: ${error.message}`)
      else report.speakers++
    }

    // Tasks
    const taskDocs = await dbGetAll('tasks')
    onProgress?.(`Migrating ${taskDocs.length} task lists…`)
    for (const doc of taskDocs) {
      const { formId, ...tasks } = doc
      const { error } = await sb.from('tasks').upsert(
        { form_id: formId, data: tasks },
        { onConflict: 'form_id' }
      )
      if (error) report.errors.push(`tasks ${formId}: ${error.message}`)
      else report.tasks++
    }

    onProgress?.('Migration complete.')
  } catch (err) {
    report.errors.push(String(err))
  }

  return report
}
const MIGRATE_DONE = 'iwc_idb_migrated_v1'

export async function migrateFromLocalStorage() {
  if (localStorage.getItem(MIGRATE_DONE)) return
  try {
    // Forms
    const forms = JSON.parse(localStorage.getItem('iwc_forms_v1') || '[]')
    for (const f of forms) await dbPut('forms', f)

    // Submissions (stored as { formId: [sub, ...] })
    const subsMap = JSON.parse(localStorage.getItem('iwc_subs_v1') || '{}')
    for (const formId of Object.keys(subsMap)) {
      for (const sub of subsMap[formId]) {
        await dbPut('submissions', { formId, ...sub })
      }
    }

    // Speakers
    const speakers = JSON.parse(localStorage.getItem('iwc_speakers_v1') || '[]')
    for (const sp of speakers) await dbPut('speakers', sp)

    // Tasks (stored as { formId: { pre, during, post } })
    const tasksMap = JSON.parse(localStorage.getItem('iwc_tasks_v1') || '{}')
    for (const formId of Object.keys(tasksMap)) {
      await dbPut('tasks', { formId, ...tasksMap[formId] })
    }

    localStorage.setItem(MIGRATE_DONE, '1')
    console.log('[IWC] Migrated existing data from localStorage → IndexedDB')
  } catch (err) {
    console.warn('[IWC] Migration error (non-fatal):', err)
  }
}
