import test from 'node:test';
import assert from 'node:assert/strict';

import { createScraper, ScraperDeps } from '../src/core/scraper';

const makeDeps = (): { deps: ScraperDeps; records: any } => {
  const records: any = { saves: [], logs: [] };
  const pages: Record<string, any> = {
    u1: { baseInfo: { url_next: '/next' }, context: ['a', 'a', 'b'] },
    'https://w.linovelib.com/next': { baseInfo: { url_next: '#' }, context: ['c'] },
  };

  const deps: ScraperDeps = {
    downloadHtml: async (url) => url,
    formatHtml: async (html) => ({
      baseInfo: {
        url_previous: '', url_next: pages[html]?.baseInfo.url_next ?? '#', url_index: '', url_articleinfo: '', url_image: '', url_home: '',
        articleid: '', articlename: '', subid: '', author: '', chapterid: '', page: '', chaptername: '',
      },
      context: pages[html]?.context ?? [],
    }),
    getUrl: () => 'u1',
    getNextPageUrl: (next) => `https://w.linovelib.com${next}`,
    parseRankList: () => [{ title: 't1', url: 'u' }],
    parseNovelCatalog: () => ({ novelTitle: 'n', catalog: [{ chapterTitle: 'c1', chapterUrl: 'u1' }] }),
    saveAsFile: (f, c, d) => records.saves.push({ f, c, d }),
    logger: { log: (msg: string) => records.logs.push(msg) },
  };
  return { deps, records };
};

test('scrapeChapter aggregates and deduplicates', async () => {
  const { deps, records } = makeDeps();
  const scraper = createScraper(deps);
  await scraper.scrapeChapterByUrl('u1');
  assert.equal(records.saves[0].f, 'chapter');
  assert.equal(records.saves[0].c, 'a\nb\nc');
});

test('scrapeRank saves result', async () => {
  const { deps, records } = makeDeps();
  const scraper = createScraper(deps);
  await scraper.scrapeRank('x');
  assert.equal(records.saves[0].f, 'rank_list');
});

test('scrapeCatalog saves result', async () => {
  const { deps, records } = makeDeps();
  const scraper = createScraper(deps);
  await scraper.scrapeCatalog('x');
  assert.equal(records.saves[0].f, 'catalog');
});

test('listFromRank returns candidates', async () => {
  const { deps } = makeDeps();
  const scraper = createScraper(deps);
  const list = await scraper.listFromRank('x');
  assert.equal(list[0].title, 't1');
});
