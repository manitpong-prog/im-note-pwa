import { supabase } from '../lib/supabase';

export type Note = {
  id: string;
  user_id: string;
  local_id: number | null;
  title: string;
  content: string;
  color_index: number;
  is_pinned: boolean;
  client_created_at: string | null;
  client_updated_at: string | null;
  deleted_at: string | null;
  sync_version: number;
  device_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function getNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return data as Note[];
}

export async function createNote(input: {
  title: string;
  content: string;
  colorIndex?: number;
  isPinned?: boolean;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('กรุณาเข้าสู่ระบบก่อน');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      local_id: null,
      title: input.title,
      content: input.content,
      color_index: input.colorIndex ?? 0,
      is_pinned: input.isPinned ?? false,
      client_created_at: now,
      client_updated_at: now,
      deleted_at: null,
      sync_version: 1,
      device_id: 'pwa',
    })
    .select()
    .single();

  if (error) throw error;

  return data as Note;
}

export async function updateNote(
  id: string,
  input: Partial<{
    title: string;
    content: string;
    colorIndex: number;
    isPinned: boolean;
  }>
) {
  const patch: Record<string, unknown> = {
    client_updated_at: new Date().toISOString(),
    device_id: 'pwa',
  };

  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) patch.content = input.content;
  if (input.colorIndex !== undefined) patch.color_index = input.colorIndex;
  if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;

  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as Note;
}

export async function softDeleteNote(id: string) {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('notes')
    .update({
      deleted_at: now,
      client_updated_at: now,
      device_id: 'pwa',
    })
    .eq('id', id);

  if (error) throw error;
}