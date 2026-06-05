/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, Settings } from 'lucide-react';

export default function SupabaseGuide() {
  const [copied, setCopied] = useState(false);

  const sqlSchema = `-- iM Notes Minimal: Supabase schema for offline-first + online sync
-- Run this SQL in the Supabase SQL Editor after creating a Supabase project.

create extension if not exists pgcrypto;

-- Public profile table linked to Supabase Auth users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Online notes table.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id integer,
  title text not null default '',
  content text not null default '',
  color_index integer not null default 0,
  is_pinned boolean not null default false,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  deleted_at timestamptz,
  sync_version integer not null default 1,
  device_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Force color range check.
alter table public.notes drop constraint if exists notes_color_index_range;
alter table public.notes add constraint notes_color_index_range check (color_index >= 0 and color_index <= 99);

-- Unique index to prevent duplicate entries
alter table public.notes drop constraint if exists notes_user_device_local_unique;
alter table public.notes add constraint notes_user_device_local_unique unique (user_id, device_id, local_id);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_user_updated_idx on public.notes(user_id, updated_at desc);

-- Automatically create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.notes enable row level security;

-- Policies
create policy "Profiles are readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Profiles are updatable by owner" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can read own notes" on public.notes for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete to authenticated using (auth.uid() = user_id);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-6 flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md">
            <Database className="w-6 h-6" id="db-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Supabase Configuration Required</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
              To start using <strong>iM Notes Minimal</strong>, please connect your Supabase database. You can do this by entering your credentials in the <strong>Secrets Panel</strong> in Google AI Studio.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">1</span>
              Configure Environment Variables
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
              Add the following environment variables using the <strong>Secrets Settings</strong> in the AI Studio UI:
            </p>
            <div className="bg-zinc-900 text-zinc-100 rounded-xl p-4 font-mono text-xs space-y-2 border border-zinc-800">
              <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                <div>
                  <span className="text-emerald-400 font-semibold">VITE_SUPABASE_URL</span>
                  <p className="text-zinc-500 mt-0.5">https://your-project-ref.supabase.co</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                <div>
                  <span className="text-emerald-400 font-semibold">VITE_SUPABASE_ANON_KEY</span>
                  <p className="text-zinc-500 mt-0.5">eyJhbGciOiJIUzI1NiIs...</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5 font-mono">
              <Settings className="w-3.5 h-3.5" /> Set these variables and the app will reload automatically!
            </p>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">2</span>
                Initialize Supabase Schema
              </h2>
              <button
                id="btn-copy-sql"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy SQL'}
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">
              Go to your Supabase Dashboard &rarr; <strong>SQL Editor</strong>, create a new query, paste the schema script, and run it. This satisfies the <code>public.notes</code>, <code>public.profiles</code> tables, automatic profile sync, and RLS policies.
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 p-4 relative">
              <pre className="whitespace-pre-wrap">{sqlSchema}</pre>
            </div>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
            <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" id="terminal-icon" />
            <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              <strong>Need a Supabase account?</strong> Create one for free at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5 font-semibold text-blue-900 dark:text-blue-200 hover:text-blue-700">supabase.com <ExternalLink className="w-3 h-3" /></a>. Once created, paste your credentials to start capturing thoughts seamlessly with secure Auth and RLS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
