export type Message = { role: 'user' | 'assistant'; content: string };
export type Analytics = { atsScore: number; keywordMatch: number; matchedKeywords: string[]; missingKeywords: string[]; suggestions: string[] };
export type Resume = { id: string; title: string; job: string; latex: string; pdf: string | null; analytics: Analytics | null; updated: string };
export type Template = { id: string; name: string; latex: string; isDefault: boolean };
export type Draft = { job: string; latex: string; pdf: string | null; analytics: Analytics | null; activeId: string | null; templateId: string; messages: Message[]; chatInput: string; editorName: string; editorLatex: string; editingTemplateId: string | null };
export const emptyDraft: Draft = { job: '', latex: '', pdf: null, analytics: null, activeId: null, templateId: '', messages: [], chatInput: '', editorName: '', editorLatex: '', editingTemplateId: null };
let database: Promise<IDBDatabase> | undefined;
function open() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('resumestudio-local-test', 1);
    request.onupgradeneeded = () => { for (const name of ['resumes', 'templates', 'state']) request.result.createObjectStore(name, { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('Close other ResumeStudio tabs and retry.'));
  });
}
async function transaction<T>(store: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = () => reject(tx.error || request.error || new Error('Local storage failed.'));
    tx.onerror = () => reject(tx.error || new Error('Local storage failed.'));
  });
}
export const listResumes = () => transaction<Resume[]>('resumes', 'readonly', s => s.getAll());
export const listTemplates = () => transaction<Template[]>('templates', 'readonly', s => s.getAll());
export const putResume = (value: Resume) => transaction('resumes', 'readwrite', s => s.put(value));
export const putTemplate = (value: Template) => transaction('templates', 'readwrite', s => s.put(value));
export const deleteResume = (id: string) => transaction('resumes', 'readwrite', s => s.delete(id));
export const deleteTemplate = (id: string) => transaction('templates', 'readwrite', s => s.delete(id));
export async function readDraft(): Promise<Draft> {
  const row = await transaction<{ id: string; value: Draft } | undefined>('state', 'readonly', s => s.get('draft'));
  return { ...emptyDraft, ...row?.value };
}
export const writeDraft = (value: Draft) => transaction('state', 'readwrite', s => s.put({ id: 'draft', value }));
export async function setDefaultTemplate(id: string) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const request = tx.objectStore('templates').openCursor();
    request.onsuccess = () => { const c = request.result; if (c) { c.update({ ...c.value, isDefault: c.value.id === id }); c.continue(); } };
    tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error); tx.onerror = () => reject(tx.error);
  });
}
