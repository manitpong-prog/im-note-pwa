/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorPreset } from '../types';

export const COLOR_PRESETS: ColorPreset[] = [
  {
    index: 0,
    bgClass: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100',
    borderClass: 'border-zinc-300 dark:border-zinc-700',
    textClass: 'text-zinc-600 dark:text-zinc-400',
    name: 'Minimal White',
  },
  {
    index: 1,
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100',
    borderClass: 'border-amber-300 dark:border-amber-800',
    textClass: 'text-amber-800 dark:text-amber-300',
    name: 'Warm Amber',
  },
  {
    index: 2,
    bgClass: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/60 text-sky-950 dark:text-sky-100',
    borderClass: 'border-sky-300 dark:border-sky-800',
    textClass: 'text-sky-800 dark:text-sky-300',
    name: 'Ocean Sky',
  },
  {
    index: 3,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-100',
    borderClass: 'border-emerald-300 dark:border-emerald-800',
    textClass: 'text-emerald-800 dark:text-emerald-300',
    name: 'Emerald Menthe',
  },
  {
    index: 4,
    bgClass: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/60 text-violet-950 dark:text-violet-100',
    borderClass: 'border-violet-300 dark:border-violet-800',
    textClass: 'text-violet-800 dark:text-violet-300',
    name: 'Posh Lavender',
  },
  {
    index: 5,
    bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100',
    borderClass: 'border-rose-300 dark:border-rose-800',
    textClass: 'text-rose-800 dark:text-rose-300',
    name: 'Sweet Rose',
  },
  {
    index: 6,
    bgClass: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/60 text-orange-950 dark:text-orange-100',
    borderClass: 'border-orange-300 dark:border-orange-800',
    textClass: 'text-orange-800 dark:text-orange-300',
    name: 'Sunset Orange',
  },
  {
    index: 7,
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 text-indigo-950 dark:text-indigo-100',
    borderClass: 'border-indigo-300 dark:border-indigo-800',
    textClass: 'text-indigo-800 dark:text-indigo-300',
    name: 'Royal Indigo',
  },
];

export function getColorPreset(index: number): ColorPreset {
  const normalizedIndex = Math.max(0, Math.min(99, index));
  const mappedPreset = COLOR_PRESETS[normalizedIndex % COLOR_PRESETS.length];
  return {
    ...mappedPreset,
    index: normalizedIndex,
  };
}

export function getLightNoteTint(index: number): string {
  const normalizedIndex = Math.max(0, Math.min(99, index)) % COLOR_PRESETS.length;
  const tints = [
    'linear-gradient(180deg, #fbfaf7 0%, #f7f7f5 100%)',
    'linear-gradient(180deg, #fff1bd 0%, #fff8df 48%, #fbfaf7 100%)',
    'linear-gradient(180deg, #dff4ff 0%, #f0f9ff 52%, #fbfaf7 100%)',
    'linear-gradient(180deg, #dcfce7 0%, #effdf6 52%, #fbfaf7 100%)',
    'linear-gradient(180deg, #ede9fe 0%, #f7f3ff 52%, #fbfaf7 100%)',
    'linear-gradient(180deg, #ffe4e8 0%, #fff1f4 52%, #fbfaf7 100%)',
    'linear-gradient(180deg, #ffedd5 0%, #fff6ed 52%, #fbfaf7 100%)',
    'linear-gradient(180deg, #e0e7ff 0%, #f1f4ff 52%, #fbfaf7 100%)',
  ];
  return tints[normalizedIndex];
}
