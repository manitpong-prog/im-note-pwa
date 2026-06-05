/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Note } from '../types';
import { X, Check, Pin, Award, Sparkles, Loader2, Calendar } from 'lucide-react';
import { COLOR_PRESETS, getColorPreset } from '../lib/colors';
import { motion, AnimatePresence } from 'motion/react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, [note]);

  // Handle ES Cape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      setErrorMsg('Please enter either a title or some content.');
      return;
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
      onClose();
    } catch (err: any) {
      console.error('Error saving note:', err);
      setErrorMsg(err.message || 'Failed to save note. Please verify Database connection or try again.');
    } finally {
      setSaving(false);
    }
  };

  const preset = getColorPreset(colorIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-zinc-950/20 dark:bg-black/40 font-sans">
      {/* Background overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10 transition-colors duration-300 ${preset.bgClass} md:scale-100`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center bg-white/20 dark:bg-black/10 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {note ? 'Edit Note' : 'New Thought'}
          </span>
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
              id="btn-close-modal"
              type="button"
              onClick={onClose}
              className="p-2 bg-white/80 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              className="w-full bg-transparent border-0 outline-none text-xl font-bold tracking-tight text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:placeholder:text-zinc-300"
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
              className="w-full bg-transparent border-0 outline-none resize-none text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:placeholder:text-zinc-300 h-64"
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

        {/* Footer actions with colors */}
        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/20 dark:bg-black/10 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Color Swatches */}
            <div className="flex flex-wrap items-center gap-2">
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

            {/* Save Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="btn-modal-cancel"
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="btn-modal-save"
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-zinc-900 dark:bg-amber-500 hover:bg-zinc-800 dark:hover:bg-amber-600 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 text-white dark:text-zinc-950 text-xs font-black rounded-xl transition shadow-lg shadow-zinc-900/10 dark:shadow-amber-500/10 flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {saving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
