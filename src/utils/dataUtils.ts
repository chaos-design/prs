import { Word, IndexResult, IndexGroup, BuildIndexOptions } from '../types';

export function normalizeKey(label: string): string {
  const s = String(label || '').toLowerCase().trim();
  return s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'na';
}

export function getInitial(label: string): string {
  const s = String(label || '').replace(/^[-\s]+/, '').toUpperCase();
  if (!s) return '#';
  const c = s[0];
  if (c >= 'A' && c <= 'Z') return c;
  return '#';
}

export function normalizeText(value: any): string {
  if (Array.isArray(value)) {
    return value.map((v) => (v == null ? '' : String(v))).join('；').trim();
  }
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export interface HighlightResult {
  before: string;
  middle: string;
  after: string;
  match: boolean;
}

export function highlightWordHead(head: string, query: string): string | HighlightResult {
  const text = String(head || '');
  const q = String(query || '').trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const idx = lowerText.indexOf(lowerQ);
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const middle = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return { before, middle, after, match: true };
}

export function buildIndex(words: Word[], fieldName: keyof Word, cnFieldName: keyof Word, options?: BuildIndexOptions): IndexResult {
  const opts = options || {};
  const groups: Record<string, IndexGroup> = {};

  for (const w of words) {
    const value = w[fieldName];
    let raw = '';
    if (Array.isArray(value)) {
      raw = value.join(' + ');
    } else if (value !== null && value !== undefined) {
      raw = String(value);
    }
    raw = raw.trim();
    if (!raw) continue;
    if (raw === '无') continue;
    if (opts.skip && opts.skip.has(raw)) continue;

    const key = raw;
    if (!groups[key]) {
      groups[key] = {
        label: key,
        cn: normalizeText(w[cnFieldName]),
        words: [],
      };
    } else if (!groups[key].cn) {
      const candidate = normalizeText(w[cnFieldName]);
      if (candidate) {
        groups[key].cn = candidate;
      }
    }
    groups[key].words.push(w);
  }

  const items = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));

  const letterMap: Record<string, IndexGroup[]> = {};
  for (const g of items) {
    const initial = getInitial(g.label);
    if (!letterMap[initial]) letterMap[initial] = [];
    letterMap[initial].push(g);
  }

  return { groupsByLabel: groups, items, letterMap };
}
