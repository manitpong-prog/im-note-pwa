/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Note, Profile } from '../types';
import { getColorPreset, COLOR_PRESETS } from '../lib/colors';
import {
  Search,
  Grid,
  List,
  LogOut,
  Plus,
  Pin,
  Trash2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  User,
  Check,
  X,
  ArrowLeft,
  ExternalLink,
  Pencil,
  FileText,
  AlertTriangle,
  Loader2,
  Menu,
} from 'lucide-react';
import NoteModal from './NoteModal';
import { motion, AnimatePresence } from 'motion/react';

interface NotesWorkspaceProps {
  user: any;
  onSignOut: () => void;
}

export default function NotesWorkspace({ user, onSignOut }: NotesWorkspaceProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Navigation Sidebar and responsive menu states
  const [activeNav, setActiveNav] = useState<'all' | 'pinned' | 'trash'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter/Layout controls
  const [searchTerm, setSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<number | null>(null);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Modals state
  const [activeModalNote, setActiveModalNote] = useState<Note | null>(null);
  const [activeReadNote, setActiveReadNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [updatedDisplayName, setUpdatedDisplayName] = useState('');

  // Fetch lists
  const fetchNotes = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data as Note[] || []);
    } catch (err: any) {
      console.error('Fetch notes failed:', err);
      setErrorMsg(err.message || 'Unable to load notes from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Profile sync delay. Using fallback display.');
        setProfile({
          id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return;
      }
      setProfile(data as Profile);
      setUpdatedDisplayName(data.display_name || '');
    } catch (err) {
      console.error('Fetch profile metadata failed:', err);
    }
  }, [user]);

  // Sync profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setSavingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: updatedDisplayName.trim(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data as Profile);
      setEditProfileOpen(false);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Failed to update display name.');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchProfile();
  }, [fetchNotes, fetchProfile]);

  // Pin Toggle
  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (!supabase) return;

    const originalNotes = [...notes];
    const nextPinnedState = !note.is_pinned;
    setNotes(prev =>
      prev
        .map(n => n.id === note.id ? { ...n, is_pinned: nextPinnedState, updated_at: new Date().toISOString() } : n)
        .sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
    );

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: nextPinnedState, updated_at: new Date().toISOString() })
        .eq('id', note.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to pin/unpin note:', err);
      setNotes(originalNotes);
    }
  };

  // Direct fast color change on card
  const handleQuickColor = async (e: React.MouseEvent, note: Note, colorIndex: number) => {
    e.stopPropagation();
    if (!supabase) return;

    const originalNotes = [...notes];
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, color_index: colorIndex } : n));

    try {
      const { error } = await supabase
        .from('notes')
        .update({ color_index: colorIndex, updated_at: new Date().toISOString() })
        .eq('id', note.id);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update color:', err);
      setNotes(originalNotes);
    }
  };

  // Hard Delete
  const handleConfirmDelete = async () => {
    if (!supabase || !deletingNoteId) return;

    const originalNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== deletingNoteId));
    setDeletingNoteId(null);

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', deletingNoteId);

      if (error) throw error;
    } catch (err) {
      console.error('Delete execution failed:', err);
      setNotes(originalNotes);
      alert('Delete failed. Please check internet connection.');
    }
  };

  // Save/Edit action handler inside modal
  const handleSaveNote = (savedNote: Note) => {
    setActiveReadNote(prev => prev?.id === savedNote.id ? savedNote : prev);
    setNotes(prev => {
      const exists = prev.some(n => n.id === savedNote.id);
      let updatedList;
      if (exists) {
        updatedList = prev.map(n => n.id === savedNote.id ? savedNote : n);
      } else {
        updatedList = [savedNote, ...prev];
      }
      return updatedList.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    });
  };

  // Filters calculation based on left Sidebar active tabs
  const filteredNotes = notes.filter(note => {
    const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
    const contentMatch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const colorMatch = colorFilter === null || note.color_index === colorFilter;
    
    // Sidebar active category filter
    const navMatch = 
      activeNav === 'all' ? true :
      activeNav === 'pinned' ? note.is_pinned :
      activeNav === 'trash' ? false : true;

    return (titleMatch || contentMatch) && colorMatch && navMatch;
  });

  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const otherNotes = filteredNotes.filter(note => !note.is_pinned);

  // Sidebar reusable navigation content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/10 shrink-0">
          <span className="text-white font-extrabold text-sm italic tracking-tight">iM</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
            Notes Minimal
          </h1>
          <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
            Online Mode
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <button
          id="sidebar-nav-all"
          onClick={() => {
            setActiveNav('all');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeNav === 'all'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border-l-4 border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="flex-1 text-left">All Notes</span>
          <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {notes.length}
          </span>
        </button>

        <button
          id="sidebar-nav-pinned"
          onClick={() => {
            setActiveNav('pinned');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeNav === 'pinned'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border-l-4 border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Pin className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Pinned Notes</span>
          <span className="text-xs bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {notes.filter(n => n.is_pinned).length}
          </span>
        </button>

        <button
          id="sidebar-nav-trash"
          onClick={() => {
            setActiveNav('trash');
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeNav === 'trash'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border-l-4 border-indigo-600'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Trash</span>
        </button>
      </nav>

      {/* Side User Center Panel */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl shadow-sm">
          <button
            id="sidebar-edit-profile"
            onClick={() => {
              setUpdatedDisplayName(profile?.display_name || '');
              setEditProfileOpen(prev => !prev);
            }}
            title="Edit profile"
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 flex-shrink-0 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase hover:bg-indigo-100 hover:text-indigo-700 transition"
          >
            {profile?.display_name?.charAt(0) || user.email?.charAt(0) || '?'}
          </button>
          
          <div className="flex-1 min-w-0">
            <button
              onClick={() => {
                setUpdatedDisplayName(profile?.display_name || '');
                setEditProfileOpen(prev => !prev);
              }}
              className="text-left block w-full"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-tight hover:underline">
                {profile?.display_name || user.email?.split('@')[0]}
              </p>
              <p className="text-3s text-slate-500 truncate mt-0.5 leading-none">
                Online (PWA)
              </p>
            </button>
          </div>

          <button
            id="sidebar-btn-signout"
            onClick={onSignOut}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
            title="Sign Out Session"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex-col shrink-0">
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE DRAWER SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            {/* Drawer menu body */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-[80vw] h-full bg-white dark:bg-zinc-900 flex flex-col z-10 border-r border-slate-200 dark:border-zinc-800 shadow-2xl"
            >
              {renderSidebarContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-zinc-950 h-full overflow-hidden">
        
        {/* TOP SEARCH BAR HEADER */}
        <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Mobile Sidebar Hamburger Trigger */}
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden shrink-0"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Pill Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="search-input"
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-850 rounded-full bg-slate-50 dark:bg-zinc-950/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Action FAB Row & Layout toggle */}
          <div className="ml-4 flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Color Palette Switcher & Layout switcher on wide views */}
            <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-slate-200/50 dark:border-zinc-850">
              <button
                id="btn-layout-grid-top"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-full transition-all ${
                  viewLayout === 'grid' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-layout-list-top"
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-full transition-all ${
                  viewLayout === 'list' ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              id="btn-new-note"
              onClick={() => {
                setActiveModalNote(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 font-black" />
              <span className="hidden xs:inline">New Note</span>
            </button>
          </div>
        </header>

        {/* Profile editing dropdown pane */}
        <AnimatePresence>
          {editProfileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shrink-0 z-10"
            >
              <form onSubmit={handleUpdateProfile} className="max-w-2xl mx-auto p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Update Profile Name</span>
                  <input
                    id="input-workspace-displayname"
                    type="text"
                    required
                    value={updatedDisplayName}
                    onChange={(e) => setUpdatedDisplayName(e.target.value)}
                    placeholder="E.g. Jane Doe"
                    disabled={savingProfile}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <button
                    id="btn-profile-cancel"
                    type="button"
                    onClick={() => setEditProfileOpen(false)}
                    disabled={savingProfile}
                    className="px-3.5 py-2 text-[11px] text-slate-500 bg-slate-100 hover:bg-slate-250 dark:bg-zinc-800 dark:text-zinc-400 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-profile-save"
                    type="submit"
                    disabled={savingProfile}
                    className="px-4 py-2 text-[11px] bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Change
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WORKSPACE CENTRAL WORK AREA SCROLL PANEL */}
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-8">
          
          {/* Status Server Alert Error Notifications */}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 text-sm text-red-700 dark:text-red-400 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Fetch Alert</p>
                <p className="text-xs opacity-90 mt-0.5">{errorMsg}</p>
                <button
                  id="btn-retry-fetch"
                  onClick={fetchNotes}
                  className="mt-2 text-xs font-bold underline inline-flex items-center gap-1 text-red-850 dark:text-red-300"
                >
                  <RefreshCw className="w-3 h-3" /> Retry cloud synchronize
                </button>
              </div>
            </div>
          )}

          {/* Color filter block on wide screens */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-zinc-900">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">Color Index Filters</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-850 shadow-3xs">
              <button
                id="filter-color-all"
                onClick={() => setColorFilter(null)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                  colorFilter === null
                    ? 'bg-slate-900 text-white dark:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              {COLOR_PRESETS.map(p => (
                <button
                  id={`filter-color-${p.index}`}
                  key={p.index}
                  onClick={() => setColorFilter(p.index)}
                  title={`Filter: ${p.name}`}
                  className={`w-4 h-4 rounded-full border border-black/10 transition-transform ${
                    colorFilter === p.index ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: p.index === 0 ? '#fafafa' : p.index === 1 ? '#fffbeb' : p.index === 2 ? '#f0f9ff' : p.index === 3 ? '#ecfdf5' : p.index === 4 ? '#f5f3ff' : p.index === 5 ? '#fff1f2' : p.index === 6 ? '#fff7ed' : '#e0e7ff' }}
                />
              ))}
            </div>
          </div>

          {/* Tab notification */}
          {activeNav !== 'all' && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/25 px-3 py-1.5 rounded-lg border border-indigo-150 inline-flex">
              <span className="capitalize">{activeNav} Filter Active</span>
              <button onClick={() => setActiveNav('all')} className="hover:opacity-75"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Synchronizing server loading states */}
          {loading && notes.length === 0 ? (
            <div className="py-24 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" id="spin-load" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 font-sans">Synchronizing PWA Cloud records live...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            
            /* High-fidelity Empty State */
            <div className="py-16 max-w-md mx-auto text-center bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Notes Found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed">
                {searchTerm || colorFilter !== null
                  ? "We couldn't matching any notes for your search or color selection. Try adjusting your query or filters."
                  : activeNav === 'trash' ? "Yes, we use hard delete. The trash directory is mock only — notes are deleted permanently." : "Capturing fleeting thoughts is the best memory tool. Click the 'New Note' button to post secure online notes."}
              </p>
              {!searchTerm && colorFilter === null && activeNav !== 'trash' && (
                <button
                  id="btn-empty-add"
                  onClick={() => {
                    setActiveModalNote(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-6 inline-flex items-center gap-1.5 px-4  py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Capture New Thought
                </button>
              )}
            </div>
          ) : (
            // Grid or List Work area panels
            <div className="space-y-10">
              
              {/* PINNED AREA HEADER */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 fill-current text-indigo-600 dark:text-indigo-400" />
                    <span>Pinned Thoughts ({pinnedNotes.length})</span>
                  </h3>
                  <div
                    className={
                      viewLayout === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                        : 'flex flex-col gap-4'
                    }
                  >
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        layout={viewLayout}
                        onRead={() => setActiveReadNote(note)}
                        onEdit={() => {
                          setActiveModalNote(note);
                          setIsModalOpen(true);
                        }}
                        onTogglePin={(e) => handleTogglePin(e, note)}
                        onDelete={() => setDeletingNoteId(note.id)}
                        onQuickColor={(e, colorIndex) => handleQuickColor(e, note, colorIndex)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT UNPINNED AREA */}
              {otherNotes.length > 0 && (
                <div className="space-y-4">
                  {pinnedNotes.length > 0 && (
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                      <span>Recent Thoughts ({otherNotes.length})</span>
                    </h3>
                  )}
                  <div
                    className={
                      viewLayout === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                        : 'flex flex-col gap-4'
                    }
                  >
                    {otherNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        layout={viewLayout}
                        onRead={() => setActiveReadNote(note)}
                        onEdit={() => {
                          setActiveModalNote(note);
                          setIsModalOpen(true);
                        }}
                        onTogglePin={(e) => handleTogglePin(e, note)}
                        onDelete={() => setDeletingNoteId(note.id)}
                        onQuickColor={(e, colorIndex) => handleQuickColor(e, note, colorIndex)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* BOTTOM REAL-TIME SYNC STATUS BAR */}
        <footer className="h-8 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 px-8 flex items-center justify-between shrink-0 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Sync: Connected (PWA)</span>
          </div>
          <span>Schema: v1.1 Minimal DB</span>
        </footer>

      </main>

      {/* Note Edit/Create Modal overlay */}
      <AnimatePresence>
        {activeReadNote && (
          <NoteReadView
            note={activeReadNote}
            onClose={() => setActiveReadNote(null)}
            onEdit={() => {
              setActiveModalNote(activeReadNote);
              setActiveReadNote(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Note Edit/Create Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <NoteModal
            key="note-modal"
            note={activeModalNote}
            userId={user.id}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveNote}
          />
        )}
      </AnimatePresence>

      {/* Permanent delete confirmation overlay */}
      <AnimatePresence>
        {deletingNoteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl"
            >
              <div className="w-10 h-10 rounded-full bg-red-105 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200/40">
                <Trash2 className="w-5 h-5 animate-bounce" id="bounce-trash" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Hard Delete Note?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  This action is irreversible. The note card will be deleted permanently from your Supabase server database. No local note database or soft deletes are used.
                </p>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  id="btn-delete-cancel"
                  type="button"
                  onClick={() => setDeletingNoteId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 text-xs font-bold rounded-xl"
                >
                  No, Keep It
                </button>
                <button
                  id="btn-delete-confirm"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Yes, Hard Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Internal NoteCard Component optimized for the Sleek Interface */
interface NoteCardProps {
  key?: string | number;
  note: Note;
  layout: 'grid' | 'list';
  onRead: () => void;
  onEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onQuickColor: (e: React.MouseEvent, colorIndex: number) => void;
}

function NoteCard({ note, layout, onRead, onEdit, onTogglePin, onDelete, onQuickColor }: NoteCardProps) {
  const preset = getColorPreset(note.color_index);
  const [hovered, setHovered] = useState(false);
  const tapTimerRef = useRef<number | null>(null);
  const lastTapAtRef = useRef(0);

  const clearPendingRead = () => {
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  };

  useEffect(() => clearPendingRead, []);

  const handleCardPointerUp = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;

    const now = Date.now();
    if (now - lastTapAtRef.current < 280) {
      clearPendingRead();
      lastTapAtRef.current = 0;
      onEdit();
      return;
    }

    lastTapAtRef.current = now;
    clearPendingRead();
    tapTimerRef.current = window.setTimeout(() => {
      tapTimerRef.current = null;
      onRead();
    }, 220);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRead();
    }
  };

  return (
    <motion.div
      id={`note-card-${note.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerUp={handleCardPointerUp}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      className={`border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between relative ${preset.bgClass} ${
        layout === 'list' ? 'sm:flex-row sm:items-center sm:gap-4' : 'h-60'
      }`}
    >
      <div className={`space-y-3 flex-1 min-w-0 ${layout === 'list' ? 'sm:flex sm:items-center sm:gap-6' : ''}`}>
        
        {/* Title / Pinned icon tag */}
        <div className={`flex items-start justify-between ${layout === 'list' ? 'sm:w-1/3 shrink-0' : ''}`}>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-6">
            {note.title || <span className="italic font-light text-slate-400 dark:text-zinc-650">Untitled thoughts</span>}
          </h4>
          <button
            id={`btn-pin-${note.id}`}
            onClick={onTogglePin}
            title={note.is_pinned ? 'Unpin card' : 'Pin card'}
            className={`absolute top-4 right-4 p-1.5 rounded-xl border transition-all ${
              note.is_pinned
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300 opacity-100'
                : 'bg-white/50 border-zinc-200/50 text-zinc-400 opacity-0 group-hover:opacity-100 focus:opacity-100'
            }`}
          >
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current text-purple-700' : ''}`} />
          </button>
        </div>

        {/* Content text snippet */}
        <p className={`text-xs text-slate-600 dark:text-zinc-300 leading-relaxed overflow-hidden break-words ${
          layout === 'list' ? 'line-clamp-1 flex-1 sm:pr-8' : 'line-clamp-5'
        }`}>
          {note.content || <span className="italic text-slate-400 dark:text-slate-600">No content entered...</span>}
        </p>
      </div>

      {/* Card actions footer layout */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-slate-200/30 dark:border-zinc-800/30 gap-2.5 mt-4 pt-4 shrink-0 overflow-hidden ${
        layout === 'list' ? 'sm:mt-0 sm:pt-0 sm:border-0 sm:w-auto sm:justify-end sm:gap-4' : ''
      }`}>
        
        {/* Timestamp */}
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-none">
          {new Date(note.updated_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {/* Fast color swatch edits & delete commands */}
        <div className="flex items-center gap-2">
          {/* Group hover swatches picker */}
          <div className="flex items-center gap-1 bg-white/60 dark:bg-black/10 px-1.5 py-0.5 rounded-lg border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
            {COLOR_PRESETS.slice(0, 5).map(p => {
              const swatchPreset = getColorPreset(p.index);
              const isSelected = note.color_index === p.index;
              return (
                <button
                  id={`btn-color-${note.id}-${p.index}`}
                  key={p.index}
                  onClick={(e) => onQuickColor(e, p.index)}
                  title={swatchPreset.name}
                  className={`w-3 h-3 rounded-full border border-black/10 transition-transform ${
                    isSelected ? 'ring-2 ring-indigo-500 scale-125' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: p.index === 0 ? '#ffffff' : p.index === 1 ? '#fffbeb' : p.index === 2 ? '#f0f9ff' : p.index === 3 ? '#ecfdf5' : '#f5f3ff' }}
                />
              );
            })}
          </div>

          <button
            id={`btn-delete-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete card permanently"
            className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition border border-transparent hover:border-rose-100 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface NoteReadViewProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
}

function NoteReadView({ note, onClose, onEdit }: NoteReadViewProps) {
  const preset = getColorPreset(note.color_index);
  const lastTapAtRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReadPointerUp = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a')) return;

    const now = Date.now();
    if (now - lastTapAtRef.current < 320) {
      lastTapAtRef.current = 0;
      onEdit();
      return;
    }

    lastTapAtRef.current = now;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18 }}
      className={`fixed inset-0 z-50 flex flex-col border-0 font-sans ${preset.bgClass}`}
    >
      <header className="h-16 shrink-0 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between gap-3">
        <button
          id="btn-read-back"
          type="button"
          onClick={onClose}
          title="Back"
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 text-slate-700 dark:text-zinc-200 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-zinc-500">
            Read
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
            {new Date(note.updated_at).toLocaleString()}
          </p>
        </div>

        <button
          id="btn-read-edit"
          type="button"
          onClick={onEdit}
          title="Edit note"
          className="w-10 h-10 rounded-full bg-slate-950 dark:bg-amber-500 text-white dark:text-zinc-950 flex items-center justify-center hover:opacity-90 transition shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-16"
        onPointerUp={handleReadPointerUp}
      >
        <article className="mx-auto max-w-3xl space-y-7">
          <div className="flex items-start gap-3">
            {note.is_pinned && (
              <div className="mt-1 w-8 h-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-200 flex items-center justify-center border border-amber-200 dark:border-amber-900">
                <Pin className="w-4 h-4 fill-current" />
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-black leading-tight text-slate-950 dark:text-white break-words">
              {note.title || 'Untitled thoughts'}
            </h1>
          </div>

          <div className="min-h-[55vh] whitespace-pre-wrap break-words text-base sm:text-lg leading-8 text-slate-700 dark:text-zinc-200">
            {note.content ? (
              <LinkifiedText text={note.content} />
            ) : (
              <span className="italic text-slate-400 dark:text-zinc-500">No content entered...</span>
            )}
          </div>
        </article>
      </main>
    </motion.div>
  );
}

function LinkifiedText({ text }: { text: string }) {
  const urlPattern = /((?:https?:\/\/|mailto:|tel:|sms:)[^\s<>"']+|www\.[^\s<>"']+)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  text.replace(urlPattern, (match, _group, offset) => {
    if (offset > lastIndex) {
      parts.push(text.slice(lastIndex, offset));
    }

    const cleanMatch = match.replace(/[),.;!?]+$/, '');
    const trailing = match.slice(cleanMatch.length);
    const href = cleanMatch.startsWith('www.') ? `https://${cleanMatch}` : cleanMatch;

    parts.push(
      <a
        key={`${cleanMatch}-${offset}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-amber-300 underline decoration-current/30 underline-offset-4 hover:decoration-current"
        onClick={(e) => e.stopPropagation()}
      >
        <span>{cleanMatch}</span>
        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
      </a>
    );

    if (trailing) {
      parts.push(trailing);
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
