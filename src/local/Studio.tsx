// Personal Android test client: a forest-ink document workbench, no account UI.
// System sans controls + Georgia headline; #203d34 ink, #f3f5f1 paper, #dceab4 accent.
// Signature: an explicit boundary between on-device saves and cloud processing.
import { useEffect, useRef, useState } from 'react';
import { api, exportFile, textBase64 } from './api';
import { emptyDraft, readDraft, writeDraft, listResumes, listTemplates, putResume, putTemplate, deleteResume, deleteTemplate, setDefaultTemplate, type Draft, type Resume, type Template, type Message, type Analytics } from './store';
type Tab = 'create' | 'templates' | 'saved' | 'about';
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong.';
const latexFrom = (value: string) => {
  const block = value.match(/```(?:latex|tex)\s*([\s\S]*?)```/i);
  return (block?.[1] || value).match(/\\documentclass[\s\S]*?\\end\{document\}/)?.[0] || '';
};
export default function Studio() {
  const [tab, setTab] = useState<Tab>('create');
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(''); const busyRef = useRef(false);
  const [notice, setNotice] = useState(''); const [storageError, setStorageError] = useState('');
  const [cloudConsent, setCloudConsent] = useState(false); const [pdfPreview, setPdfPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'resume' | 'template'; id: string; name: string } | null>(null);
  const [localStatus, setLocalStatus] = useState('Loading local files...'); const saveVersion = useRef(0);
  const patch = (value: Partial<Draft>) => setDraft(previous => ({ ...previous, ...value }));
  async function refresh() {
    const [r, t] = await Promise.all([listResumes(), listTemplates()]);
    setResumes(r.sort((a,b) => b.updated.localeCompare(a.updated))); setTemplates(t);
  }
  useEffect(() => {
    Promise.all([readDraft(), listResumes(), listTemplates()]).then(([d,r,t]) => {
      if (!d.templateId) d.templateId = (t.find(x => x.isDefault) || t[0])?.id || '';
      setDraft(d); setResumes(r.sort((a,b) => b.updated.localeCompare(a.updated))); setTemplates(t);
      setReady(true); setLocalStatus('Saved on this device'); navigator.storage?.persist?.().catch(() => false);
    }).catch(e => setStorageError(`Cannot open local storage: ${errorText(e)}. Close and reopen the app; do not clear app data.`));
  }, []);
  useEffect(() => {
    if (!ready) return; const version = ++saveVersion.current; setLocalStatus('Saving on this device...');
    writeDraft(draft).then(() => {
      if (saveVersion.current === version) { setStorageError(''); setLocalStatus('Saved on this device'); }
    }).catch(e => { setStorageError(`Local save failed: ${errorText(e)}. Export important files before closing.`); setLocalStatus('Not saved'); });
  }, [draft, ready]);
  async function work(label: string, fn: () => Promise<void>) {
    if (busyRef.current) return; busyRef.current = true; setBusy(label); setNotice('');
    try { await fn(); } catch (e) { setNotice(errorText(e)); } finally { setBusy(''); busyRef.current = false; }
  }
  function requireCloud() {
    if (!cloudConsent) throw new Error('Enable cloud processing below before using AI or PDF conversion.');
    if (!navigator.onLine) throw new Error('Connect to the internet for AI or PDF conversion. Local editing and saved PDFs still work.');
  }
  async function saveGenerated(record: Resume) {
    await putResume(record); patch({ activeId: record.id, latex: record.latex, pdf: record.pdf, analytics: record.analytics }); await refresh();
  }
  async function generate() {
    await work('Tailoring with AI...', async () => {
      requireCloud(); if (!draft.job.trim()) throw new Error('Paste the job description first.');
      const template = templates.find(t => t.id === draft.templateId);
      if (!template?.latex.trim()) throw new Error('Create or choose a template containing your real resume first.');
      const { latex } = await api<{ latex: string }>('optimize', { job: draft.job, latex: template.latex });
      const record: Resume = { id: crypto.randomUUID(), title: `Resume ${new Date().toLocaleString()}`, job: draft.job, latex, pdf: null, analytics: null, updated: new Date().toISOString() };
      patch({ latex, pdf: null, analytics: null, activeId: null }); await saveGenerated(record);
      setBusy('Converting PDF...'); const warnings: string[] = [];
      try { record.pdf = (await api<{ pdf: string }>('pdf', { latex })).pdf; } catch (e) { warnings.push(`PDF: ${errorText(e)}`); }
      patch({ pdf: record.pdf }); await saveGenerated(record);
      setBusy('Analyzing job match...');
      try { record.analytics = (await api<{ analytics: Analytics }>('analyze', { latex, job: draft.job })).analytics; } catch (e) { warnings.push(`Analysis: ${errorText(e)}`); }
      setBusy('Naming your resume...');
      try { record.title = (await api<{ title: string }>('title', { job: draft.job })).title; } catch { warnings.push('Used a date-based title because AI naming was unavailable.'); }
      await saveGenerated(record); setNotice(warnings.length ? `Resume saved locally. ${warnings.join(' ')}` : 'Resume, PDF and analysis saved on this device.');
    });
  }
  async function saveCurrent(pdf = draft.pdf, analytics = draft.analytics) {
    if (!draft.latex.trim()) throw new Error('There is no resume to save.');
    const previous = resumes.find(r => r.id === draft.activeId);
    await saveGenerated({ id: previous?.id || crypto.randomUUID(), title: previous?.title || `Resume ${new Date().toLocaleString()}`, job: draft.job, latex: draft.latex, pdf, analytics, updated: new Date().toISOString() });
  }
  async function convert() { await work('Converting PDF...', async () => {
    requireCloud(); const { pdf } = await api<{ pdf: string }>('pdf', { latex: draft.latex });
    patch({ pdf }); await saveCurrent(pdf); setNotice('PDF saved locally. Export PDF lets you choose a device folder.');
  }); }
  async function analyze() { await work('Analyzing job match...', async () => {
    requireCloud(); const { analytics } = await api<{ analytics: Analytics }>('analyze', { latex: draft.latex, job: draft.job });
    patch({ analytics }); await saveCurrent(draft.pdf, analytics); setNotice('Analysis saved locally.');
  }); }
  async function download(pdf: string) { await work('Opening export...', async () => {
    const saved = await exportFile('resume.pdf', 'application/pdf', pdf);
    setNotice(saved ? (window.ResumeStudioAndroid ? 'PDF exported.' : 'PDF download requested.') : 'Export cancelled; your local copy is still saved.');
  }); }
  async function sendChat() { await work('AI is responding...', async () => {
    requireCloud(); if (!draft.chatInput.trim()) return;
    const messages: Message[] = [...draft.messages, { role: 'user', content: draft.chatInput.trim() }];
    const { text } = await api<{ text: string }>('chat', { messages });
    patch({ messages: [...messages, { role: 'assistant', content: text }], chatInput: '' });
  }); }
  async function saveTemplate() { await work('Saving template locally...', async () => {
    if (!latexFrom(draft.editorLatex)) throw new Error('Paste a complete LaTeX document, including documentclass and end{document}.');
    const id = draft.editingTemplateId || crypto.randomUUID(); const existing = templates.find(t => t.id === id);
    await putTemplate({ id, name: draft.editorName.trim() || 'My resume', latex: draft.editorLatex, isDefault: existing?.isDefault || templates.length === 0 });
    patch({ templateId: id, editingTemplateId: id }); await refresh(); setNotice('Template saved on this device.');
  }); }
  const extracted = [...draft.messages].reverse().map(m => m.role === 'assistant' ? latexFrom(m.content) : '').find(Boolean);
  const native = Boolean(window.ResumeStudioAndroid); const disabled = Boolean(busy) || !ready;
  return <div className="studio">
    <header className="masthead"><div><span className="eyebrow">PERSONAL TEST BUILD</span><h1>ResumeStudio<span className="dot">.</span></h1></div><span className="local-pill">On-device saves</span></header>
    <main><div className="statusline"><span>{localStatus}</span><span>No account. No app credits.</span></div>
      {storageError && <div role="alert" className="notice error">{storageError}</div>}
      {notice && <div role="status" className="notice">{notice}</div>}
      {busy && <div role="status" aria-live="polite" className="working"><span className="spinner" />{busy}</div>}
      <section className="privacy"><label><input type="checkbox" checked={cloudConsent} onChange={e => setCloudConsent(e.target.checked)} disabled={Boolean(busy)} /><span>Allow cloud AI and PDF processing for this session</span></label><p>Resumes, templates and chat history are saved locally. Processing sends content to your Supabase backend, Perplexity, and the PDF service; provider retention policies still apply.</p></section>
      {tab === 'create' && <section aria-label="Create resume"><div className="section-title"><span className="eyebrow">THE WORKBENCH</span><h2>Your experience.<br />A sharper first impression.</h2></div>
        <div className="workbench"><section className="paper"><label htmlFor="template">Your source resume</label>
          <select id="template" value={draft.templateId} onChange={e => patch({ templateId: e.target.value })} disabled={disabled}><option value="">Choose a local template</option>{templates.map(t => <option value={t.id} key={t.id}>{t.name}{t.isDefault ? ' (default)' : ''}</option>)}</select>
          {!templates.length && <p className="hint">Start in Templates: build your resume with AI or paste existing LaTeX. We will not invent your work history.</p>}
          <label htmlFor="job">Job description</label><textarea id="job" value={draft.job} maxLength={50000} onChange={e => patch({ job: e.target.value, analytics: null })} disabled={disabled} placeholder="Paste the role, requirements and responsibilities..." rows={9} />
          <button className="primary" disabled={disabled || !cloudConsent} onClick={generate}>Tailor resume with AI</button></section>
          <section className="paper"><div className="row"><h3>Resume output</h3>{draft.pdf && <span className="badge">PDF ready</span>}</div>
            {draft.latex ? <><label htmlFor="output">Editable LaTeX</label><textarea id="output" className="code" value={draft.latex} maxLength={100000} rows={12} disabled={disabled} onChange={e => patch({ latex: e.target.value, pdf: null, analytics: null })} />
              <p className="hint">Editing clears the old PDF and analysis. Save the changes, then convert again.</p><div className="actions">
                <button disabled={disabled} onClick={() => work('Saving locally...', async () => { await saveCurrent(); setNotice('Resume saved locally.'); })}>Save changes</button>
                <button disabled={disabled || !cloudConsent} onClick={convert}>{draft.pdf ? 'Rebuild PDF' : 'Convert to PDF'}</button>
                <button disabled={disabled || !cloudConsent || !draft.job.trim()} onClick={analyze}>Analyze match</button>
                <button disabled={disabled} onClick={() => work('Exporting LaTeX...', async () => { const saved = await exportFile('resume.tex', 'text/plain', textBase64(draft.latex)); setNotice(saved ? 'LaTeX export requested.' : 'Export cancelled.'); })}>Export LaTeX</button>
                {draft.pdf && <button className="primary" disabled={disabled} onClick={() => download(draft.pdf!)}>Export PDF</button>}
              </div>{draft.pdf && !native && <><button className="link-button" onClick={() => setPdfPreview(!pdfPreview)}>{pdfPreview ? 'Hide' : 'Show'} PDF preview</button>{pdfPreview && <iframe title="Resume PDF preview" src={`data:application/pdf;base64,${draft.pdf}`} className="pdf-preview" />}</>}
              {draft.pdf && native && <p className="hint">Export the PDF, then open it in your device's PDF viewer.</p>}
            </> : <div className="empty"><span className="document-icon">Aa</span><h3>Your next resume starts here.</h3><p>Choose your source resume, add a job description, and generate. Drafts stay on this device.</p></div>}
          </section></div>
        {draft.analytics && <section className="paper analysis"><span className="eyebrow">AI ESTIMATE, NOT AN EMPLOYER ATS RESULT</span><div className="scoreline"><div><strong>{draft.analytics.atsScore}<small>/100</small></strong><span>Estimated match</span></div><div><strong>{draft.analytics.keywordMatch}<small>%</small></strong><span>Keyword overlap</span></div></div>
          <h3>Matched keywords</h3><p>{draft.analytics.matchedKeywords.join(', ') || 'None returned.'}</p><h3>Missing keywords</h3><p>{draft.analytics.missingKeywords.join(', ') || 'None returned.'}</p><h3>Suggestions</h3>{draft.analytics.suggestions.map((s,i) => <p key={i}>{s}</p>)}</section>}
      </section>}
      {tab === 'templates' && <section aria-label="Templates"><div className="section-title"><span className="eyebrow">START WITH THE TRUTH</span><h2>Build your source resume.</h2></div><div className="workbench">
        <section className="paper"><div className="row"><h3>AI resume builder</h3><button disabled={disabled || !draft.messages.length} onClick={() => { if (window.confirm('Clear this local conversation? Save any generated template first.')) patch({ messages: [], chatInput: '' }); }}>New chat</button></div><p className="hint">Describe your real experience. The AI can ask follow-up questions and produce a complete LaTeX template.</p><div className="messages" aria-live="polite">
          {!draft.messages.length && <p className="chat-empty">Try: “Help me build a resume. Ask me one section at a time.”</p>}{draft.messages.map((m,i) => <div key={i} className={`message ${m.role}`}><strong>{m.role === 'user' ? 'You' : 'AI'}</strong><p>{m.content}</p></div>)}</div>
          <label htmlFor="chat">Your message</label><textarea id="chat" maxLength={12000} rows={3} value={draft.chatInput} disabled={disabled} onChange={e => patch({ chatInput: e.target.value })} />
          <div className="actions"><button className="primary" disabled={disabled || !cloudConsent || !draft.chatInput.trim()} onClick={sendChat}>Send to AI</button>{extracted && <button disabled={disabled} onClick={() => { patch({ editorLatex: extracted, editorName: 'AI-built resume', editingTemplateId: null }); setNotice('AI template copied to the editor. Review it, then save.'); }}>Use generated template</button>}</div>
        </section><section className="paper"><div className="row"><h3>Template editor</h3><button disabled={disabled} onClick={() => patch({ editorLatex: '', editorName: '', editingTemplateId: null })}>New</button></div>
          <label htmlFor="template-name">Template name</label><input id="template-name" maxLength={100} value={draft.editorName} disabled={disabled} onChange={e => patch({ editorName: e.target.value })} />
          <label htmlFor="template-code">Complete LaTeX resume</label><textarea id="template-code" className="code" rows={14} maxLength={100000} value={draft.editorLatex} disabled={disabled} onChange={e => patch({ editorLatex: e.target.value })} placeholder={'\\documentclass{article}\n\\begin{document}\nYour real resume...\n\\end{document}'} />
          <button className="primary" disabled={disabled} onClick={saveTemplate}>Save template locally</button></section></div>
        <section className="paper"><h3>On this device</h3>{!templates.length && <p>No saved templates yet.</p>}{templates.map(t => <article className="saved-row" key={t.id}><div><h4>{t.name}</h4><p>{t.isDefault ? 'Default template' : 'Local template'}</p></div><div className="actions">
          <button disabled={disabled} onClick={() => patch({ editorName: t.name, editorLatex: t.latex, editingTemplateId: t.id })}>Edit</button>{!t.isDefault && <button disabled={disabled} onClick={() => work('Updating default...', async () => { await setDefaultTemplate(t.id); patch({ templateId: t.id }); await refresh(); })}>Make default</button>}
          <button className="danger" disabled={disabled} onClick={() => setConfirmDelete({ kind: 'template', id: t.id, name: t.name })}>Delete</button></div></article>)}</section>
      </section>}
      {tab === 'saved' && <section aria-label="Saved resumes"><div className="section-title"><span className="eyebrow">YOUR LOCAL LIBRARY</span><h2>Ready for the next opportunity.</h2><p>No cloud sync. Clearing app data or uninstalling deletes these copies.</p></div>
        {!resumes.length && <div className="paper empty"><h3>No saved resumes yet.</h3><p>Generated resumes are saved automatically, even if PDF conversion fails.</p></div>}
        {resumes.map(r => <article className="paper saved-row" key={r.id}><div><h3>{r.title}</h3><p>{new Date(r.updated).toLocaleString()} · {r.pdf ? 'PDF saved' : 'LaTeX saved'}</p><p>{r.job.slice(0,180)}</p></div><div className="actions">
          <button disabled={disabled} onClick={() => { patch({ activeId: r.id, job: r.job, latex: r.latex, pdf: r.pdf, analytics: r.analytics }); setTab('create'); }}>Open</button>{r.pdf && <button disabled={disabled} onClick={() => download(r.pdf!)}>Export PDF</button>}
          <button className="danger" disabled={disabled} onClick={() => setConfirmDelete({ kind: 'resume', id: r.id, name: r.title })}>Delete</button></div></article>)}
      </section>}
      {tab === 'about' && <section className="paper about"><span className="eyebrow">A CLEAR BOUNDARY</span><h2>Local storage.<br />Cloud processing.</h2>
        <h3>Saved only on this device</h3><p>Resumes, PDF copies, templates, chat history and your current draft use IndexedDB. This client never writes to Supabase tables. Android cloud backup is disabled.</p>
        <h3>Sent only when you request processing</h3><p>AI operations send content to Supabase and Perplexity. PDF conversion sends LaTeX to the external compiler. Providers may retain data under their own policies; local saving does not mean zero server retention.</p>
        <h3>No login or app credit balance</h3><p>No account, subscription screen or app credit check. Cloud services still have costs, session expiry and usage limits. The Perplexity web-session integration is experimental and may stop working.</p>
        <h3>Keep a copy</h3><p>Clearing storage, uninstalling, or losing this device can lose saved data. Export PDFs and LaTeX you need. The Android export picker can save to a cloud provider only if you explicitly choose one.</p>
        <h3>Test build, not a production release</h3><p>Review AI output. Do not add experience you do not have. No API keys or session cookies belong in this app.</p></section>}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{(['create','templates','saved','about'] as Tab[]).map(t => <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{t === 'create' ? 'Create' : t === 'templates' ? 'Templates' : t === 'saved' ? 'Saved' : 'Privacy'}</button>)}</nav>
    {confirmDelete && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="paper modal"><h2 id="delete-title">Delete this local {confirmDelete.kind}?</h2><p>{confirmDelete.name}</p><p>This cannot be undone. Export anything you need first.</p><div className="actions"><button autoFocus onClick={() => setConfirmDelete(null)}>Cancel</button><button className="danger" disabled={disabled} onClick={() => work('Deleting local copy...', async () => {
      const item = confirmDelete;
      if (item.kind === 'resume') { await deleteResume(item.id); if (draft.activeId === item.id) patch({ activeId: null, latex: '', pdf: null, analytics: null, job: '' }); }
      else { await deleteTemplate(item.id); patch({ ...(draft.templateId === item.id ? { templateId: '' } : {}), ...(draft.editingTemplateId === item.id ? { editingTemplateId: null, editorName: '', editorLatex: '' } : {}) }); }
      await refresh(); setConfirmDelete(null); setNotice('Local copy deleted.');
    })}>Delete</button></div></section></div>}
  </div>;
}
