/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { ArrowLeft, Check, Pin, Sparkles, Loader2, Calendar } from 'lucide-react';
import { COLOR_PRESETS, getColorPreset } from '../lib/colors';
import { motion } from 'motion/react';

interface NoteModalProps {
  key?: string | number;
  note: Note | null; // Null if creating
  userId: string;
  onClose: () => void;
  onSave: (savedNote: Note) => void;
}

export default function NoteModal({ note, userId, onClose, onSave }: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handleBackRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColorIndex(note.color_index);
      setIsPinned(note.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setColorIndex(0);
      setIsPinned(false);
    }
    setSavedAt(null);
    setErrorMsg(null);
  }, [note]);

  const hasChanges = useCallback(() => {
    if (!note) return Boolean(title.trim() || content.trim());
    return (
      title !== note.title ||
      content !== note.content ||
      colorIndex !== note.color_index ||
      isPinned !== note.is_pinned
    );
  }, [colorIndex, content, isPinned, note, title]);

  const persistNote = useCallback(async (requireContent: boolean) => {
    if (requireContent && !note && !title.trim() && !content.trim()) {
      setErrorMsg('Please enter either a title or some content.');
      return false;
    }

    if (!hasChanges()) {
      return true;
    }

    if (!note && !title.trim() && !content.trim()) {
      return true;
    }

    setSaving(true);
    setErrorMsg(null);

    const nowIso = new Date().toISOString();

    try {
      if (note) {
        // Edit flow
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: title || '',
            content: content || '',
            color_index: colorIndex,
            is_pinned: isPinned,
            client_updated_at: nowIso,
            sync_version: (note.sync_version || 1) + 1,
            // Constraints explicitly requested:
            device_id: 'pwa',
            local_id: null,
          })
          .eq('id', note.id)
          .select()
          .single();

        if (error) throw error;
        onSave(data as Note);
      } else {
        // Insert flow
        const { data, error } = await supabase
          .from('notes')
          .insert({
            user_id: userId,
            title: title || '',
            content: content || '',
            color_index: colorIndex,
            is_pinned: isPinned,
            client_created_at: nowIso,
            client_updated_at: nowIso,
            sync_version: 1,
            // Constraints explicitly requested:
            device_id: 'pwa',
            local_id: null,
          })
          .select()
          .single();

        if (error) throw error;
        onSave(data as Note);
      }
      setSavedAt(new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }));
      return true;
    } catch (err: any) {
      console.error('Error saving note:', err);
      setErrorMsg(err.message || 'Failed to save note. Please verify Database connection or try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [colorIndex, content, hasChanges, isPinned, note, onSave, title, userId]);

  const handleSave = async () => {
    await persistNote(true);
  };

  const handleBack = useCallback(async () => {
    if (saving) return;
    const didSave = await persistNote(false);
    if (didSave) onClose();
  }, [onClose, persistNote, saving]);

  useEffect(() => {
    handleBackRef.current = handleBack;
  }, [handleBack]);

  useEffect(() => {
    const state = window.history.state || {};
    window.history.pushState({ ...state, imNoteEditor: true }, '');

    const handlePopState = () => {
      void handleBackRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  const preset = getColorPreset(colorIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden border-0 font-sans transition-colors duration-300 ${preset.bgClass}`}
    >
        {/* Header */}
        <div className="h-16 shrink-0 px-4 sm:px-8 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center bg-white/70 dark:bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="btn-editor-back"
              type="button"
              onClick={() => {
                if (window.history.state?.imNoteEditor) {
                  window.history.back();
                } else {
                  void handleBack();
                }
              }}
              disabled={saving}
              title="Back"
              className="w-10 h-10 rounded-full bg-white/85 dark:bg-zinc-900/85 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-60 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {note ? 'Edit Note' : 'New Thought'}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                {saving ? 'Saving...' : savedAt ? `Saved ${savedAt}` : 'Auto-save on back'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-pin"
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin note' : 'Pin note'}
              className={`p-2 rounded-xl border transition-all ${
                isPinned
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300 dark:bg-amber-950 dark:border-amber-900/60 dark:text-amber-200'
                  : 'bg-white/80 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100/80'
              }`}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
            <button
              id="btn-modal-save"
              type="button"
              onClick={handleSave}
              disabled={saving}
              title="Save note"
              className="h-10 px-4 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-600 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white dark:text-zinc-950 text-xs font-black rounded-full transition shadow-sm flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl space-y-5">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <input
              id="modal-note-title"
              type="text"
              placeholder="Title your note..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="w-full bg-transparent border-0 outline-none text-3xl sm:text-5xl font-black leading-tight text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:placeholder:text-zinc-300"
            />
          </div>

          <div className="space-y-1">
            <textarea
              id="modal-note-content"
              placeholder="Write your creative thoughts here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
              rows={8}
              className="w-full min-h-[55vh] bg-transparent border-0 outline-none resize-none text-base sm:text-lg leading-8 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:placeholder:text-zinc-300"
            />
          </div>

          {note && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created: {new Date(note.created_at).toLocaleString()}</span>
              {note.updated_at !== note.created_at && (
                <span>&bull; Edited: {new Date(note.updated_at).toLocaleString()}</span>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer actions with colors */}
        <div className="shrink-0 px-4 py-3 sm:px-8 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-black/20 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Color Swatches */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">
                Color theme
              </span>
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map((p) => {
                  const mappedPreset = getColorPreset(p.index);
                  const isSelected = colorIndex === p.index;
                  return (
                    <button
                      id={`color-preset-${p.index}`}
                      key={p.index}
                      type="button"
                      onClick={() => setColorIndex(p.index)}
                      style={{ filter: 'brightness(0.95)' }}
                      title={mappedPreset.name}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${mappedPreset.bgClass} ${
                        isSelected
                          ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-950 scale-110'
                          : 'scale-100 hover:scale-105 hover:brightness-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 font-black text-amber-600 dark:text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
    </motion.div>
  );
}
