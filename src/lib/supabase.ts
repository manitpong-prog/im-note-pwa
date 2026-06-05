/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Clean up any extra quotes or white space from env parser
const cleanUrl = supabaseUrl.trim().replace(/^['"]|['"]$/g, '');
const cleanKey = supabaseAnonKey.trim().replace(/^['"]|['"]$/g, '');

export const isSupabaseConfigured = 
  cleanUrl !== '' && 
  cleanKey !== '' && 
  !cleanUrl.includes('placeholder') &&
  !cleanKey.includes('placeholder');

export const supabase = isSupabaseConfigured
  ? createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;
