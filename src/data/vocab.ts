import type { Word, Phrase } from '../types';

export type VocabPayload = {
  words?: Word[];
  phrases?: Phrase[];
};

type VocabModule = { default: VocabPayload };

/**
 * 词库按等级拆分为独立 chunk：首屏只需当前等级的数据，
 * 其余等级（合计约 100KB gzip）在用户切换时才发起请求，
 * 且命中 immutable 缓存后不再重复下载。
 */
const LOADERS: Record<string, () => Promise<VocabModule>> = {
  B2: () => import('./b2_vocab.json') as Promise<VocabModule>,
  C1: () => import('./c1_vocab.json') as Promise<VocabModule>,
  C2: () => import('./c2_vocab.json') as Promise<VocabModule>,
};

export const LEVELS = ['B2', 'C1', 'C2'];
export const DEFAULT_LEVEL = 'C1';

// 缓存已加载的模块，避免切回已访问等级时重复发起请求与重复解析大 JSON。
const cache = new Map<string, Promise<VocabModule>>();

export function loadVocab(level: string): Promise<VocabModule> {
  const key = LEVELS.includes(level) ? level : DEFAULT_LEVEL;
  let pending = cache.get(key);
  if (!pending) {
    pending = LOADERS[key]().catch(err => {
      // 失败时不让缓存常驻，允许用户重试切换等级。
      cache.delete(key);
      throw err;
    });
    cache.set(key, pending);
  }
  return pending;
}