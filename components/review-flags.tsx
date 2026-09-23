'use client';
import { useEffect, useRef, useState } from 'react';
import { WORLD_VERSION } from '@/lib/world-version';
import {
  FLAG_STORAGE,
  isReviewFlag,
  exportFlags,
  type ReviewFlag,
  type ReviewSpot,
} from '@/lib/review-flags';

type Engine = {
  reviewLock: (v: boolean) => void;
  reviewSpot: () => ReviewSpot;
  setReviewFlags: (flags: ReviewFlag[]) => void;
};
// Read-only on load: the user's notes are never rewritten until they save.
function loadSavedFlags(): { flags: ReviewFlag[]; failed: boolean } {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(FLAG_STORAGE) || '[]',
    );
    if (!Array.isArray(saved) || !saved.every(isReviewFlag)) throw Error();
    return { flags: saved, failed: false };
  } catch {
    return { flags: [], failed: true };
  }
}
export function ReviewFlags({ engine }: { engine: Engine }) {
  const [initial] = useState(loadSavedFlags);
  const [flags, setFlags] = useState<ReviewFlag[]>(initial.flags),
    [panel, setPanel] = useState<'add' | 'list' | 'export' | null>(null),
    [draft, setDraft] = useState(''),
    [spot, setSpot] = useState<ReviewSpot | null>(null),
    [editing, setEditing] = useState<string | null>(null),
    [message, setMessage] = useState(
      initial.failed
        ? 'Saved flags could not be loaded. Export any new notes before leaving.'
        : '',
    );
  const dialog = useRef<HTMLDialogElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    engine.setReviewFlags(initial.flags);
  }, [engine, initial]);
  useEffect(() => {
    engine.reviewLock(!!panel);
    if (panel) {
      if (!dialog.current?.open) dialog.current?.showModal();
      input.current?.focus();
    } else {
      dialog.current?.close();
      trigger.current?.focus();
    }
    return () => engine.reviewLock(false);
  }, [panel, engine]);
  function save(next: ReviewFlag[]) {
    setFlags(next);
    engine.setReviewFlags(next);
    try {
      localStorage.setItem(FLAG_STORAGE, JSON.stringify(next));
      setMessage('Saved in this browser.');
    } catch {
      setMessage(
        'Browser storage is unavailable. Export your notes before leaving.',
      );
    }
  }
  function add() {
    setSpot(engine.reviewSpot());
    setDraft('');
    setEditing(null);
    setPanel('add');
  }
  function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!spot || !draft.trim()) return;
    const previous = flags.find((f) => f.id === editing);
    const item: ReviewFlag = {
      ...spot,
      id: previous?.id || crypto.randomUUID(),
      createdAt: previous?.createdAt || new Date().toISOString(),
      version: previous?.version || WORLD_VERSION,
      comment: draft.trim(),
    };
    save(
      previous
        ? flags.map((f) => (f.id === editing ? item : f))
        : [...flags, item],
    );
    setPanel(null);
  }
  return (
    <>
      <div className="review-controls">
        <button ref={trigger} onClick={add}>
          ⚑ Flag this spot
        </button>
        <button onClick={() => setPanel('list')}>Notes ({flags.length})</button>
        <button disabled={!flags.length} onClick={() => setPanel('export')}>
          Export notes
        </button>
      </div>
      <dialog
        className="review-dialog"
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          setPanel(null);
        }}
        aria-labelledby="review-heading"
      >
        <button
          className="review-close"
          aria-label="Close notes"
          onClick={() => setPanel(null)}
        >
          ×
        </button>
        <h2 id="review-heading">
          {panel === 'add'
            ? editing
              ? 'Edit flag'
              : 'Flag this spot'
            : panel === 'export'
              ? 'Your location feedback'
              : 'Your flags'}
        </h2>
        {panel === 'add' && spot && (
          <form onSubmit={submit}>
            <p>
              X {spot.x.toFixed(1)} · Z {spot.z.toFixed(1)} · {spot.road}
            </p>
            {spot.mode === 'bird' && (
              <p>The flag goes on the ground directly below you.</p>
            )}
            <label htmlFor="flag-comment">What needs changing here?</label>
            <textarea
              ref={input}
              id="flag-comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={4000}
              rows={5}
              required
            />
            <button type="submit" disabled={!draft.trim()}>
              Save flag
            </button>
            <button type="button" onClick={() => setPanel(null)}>
              Cancel
            </button>
          </form>
        )}
        {panel === 'list' && (
          <>
            <p>
              Saved on this browser. Export when you’re ready to share them.
            </p>
            {!flags.length && (
              <p>No flags yet. Close this panel and choose “Flag this spot”.</p>
            )}
            <ol>
              {flags.map((f, i) => (
                <li key={f.id}>
                  <strong>
                    Flag {i + 1} · X {f.x.toFixed(1)} · Z {f.z.toFixed(1)}
                  </strong>
                  <p className="flag-comment">{f.comment}</p>
                  <button
                    onClick={() => {
                      setSpot(f);
                      setDraft(f.comment);
                      setEditing(f.id);
                      setPanel('add');
                    }}
                  >
                    Edit flag {i + 1}
                  </button>
                  <button
                    onClick={() => save(flags.filter((n) => n.id !== f.id))}
                  >
                    Delete flag {i + 1}
                  </button>
                </li>
              ))}
            </ol>
            <button disabled={!flags.length} onClick={() => setPanel('export')}>
              Export all notes
            </button>
          </>
        )}
        {panel === 'export' && (
          <>
            <p>Copy everything below and paste it into our conversation.</p>
            <textarea
              ref={input}
              aria-label="Exported location feedback"
              readOnly
              rows={14}
              value={exportFlags(flags)}
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => {
                input.current?.focus();
                input.current?.select();
              }}
            >
              Select all
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(exportFlags(flags));
                  setMessage('Copied. Paste it into our conversation.');
                } catch {
                  input.current?.focus();
                  input.current?.select();
                  setMessage('Text selected — press Ctrl+C or ⌘C to copy.');
                }
              }}
            >
              Copy all notes
            </button>
          </>
        )}
        <output className="review-status">{message}</output>
      </dialog>
    </>
  );
}
