/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: string; // uuid
  user_id: string; // uuid
  local_id: number | null; // will be null per request
  title: string;
  content: string;
  color_index: number; // 0 to 99
  is_pinned: boolean;
  client_created_at: string | null;
  client_updated_at: string | null;
  deleted_at: string | null; // will be null per request (hard delete)
  sync_version: number;
  device_id: string; // "pwa"
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // uuid references auth.users(id)
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColorPreset {
  index: number;
  bgClass: string;
  borderClass: string;
  textClass: string;
  name: string;
}
