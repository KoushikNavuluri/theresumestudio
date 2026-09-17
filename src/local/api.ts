export function endpoint() {
  const raw = import.meta.env.VITE_LOCAL_RESUME_API_URL || '';
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('AI backend is not configured. Set VITE_LOCAL_RESUME_API_URL and rebuild the APK.'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || url.pathname !== '/functions/v1/local-resume' || url.username || url.password || url.search || url.hash || url.port) throw new Error('Expected an HTTPS Supabase /functions/v1/local-resume URL.');
  return url.href;
}
export async function api<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100000);
  try {
    const response = await fetch(endpoint(), { method: 'POST', credentials: 'omit', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) throw new Error(result?.error || `Backend request failed (${response.status}).`);
    return result as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The cloud service timed out. Your local data is unchanged; retry when ready.');
    throw error;
  } finally { clearTimeout(timeout); }
}
declare global { interface Window { ResumeStudioAndroid?: { saveFile(name: string, mime: string, base64: string, requestId: string): void }; } }
export async function exportFile(name: string, mime: string, base64: string): Promise<boolean> {
  if (window.ResumeStudioAndroid) {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const listener = (event: Event) => {
        const d = (event as CustomEvent).detail;
        if (d?.id !== id) return;
        window.removeEventListener('native-export', listener);
        if (d.status === 'error') reject(new Error(d.message || 'Export failed.')); else resolve(d.status === 'saved');
      };
      window.addEventListener('native-export', listener);
      try { window.ResumeStudioAndroid!.saveFile(name, mime, base64, id); }
      catch (e) { window.removeEventListener('native-export', listener); reject(e); }
    });
  }
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000); return true;
}
export function textBase64(value: string) {
  const bytes = new TextEncoder().encode(value); let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
