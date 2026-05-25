import { FormatData, PageBaseInfo } from '../types';
import { downloadHtml, formatHtml, getNextPageUrl, getUrl, parseNovelCatalog, parseRankList, saveAsFile } from '../utils';

const EMPTY_BASE_INFO: PageBaseInfo = {
  url_previous: '', url_next: '', url_index: '', url_articleinfo: '', url_image: '', url_home: '',
  articleid: '', articlename: '', subid: '', author: '', chapterid: '', page: '', chaptername: '',
};

export interface ScraperDeps {
  downloadHtml: (url: string) => Promise<string>;
  formatHtml: (html: string) => Promise<FormatData>;
  getUrl: (bookId: number, chapterId: number, suffix?: number) => string;
  getNextPageUrl: (next: string) => string;
  parseRankList: (html: string) => ReturnType<typeof parseRankList>;
  parseNovelCatalog: (html: string) => ReturnType<typeof parseNovelCatalog>;
  saveAsFile: (filename: string, context: string, formatData: FormatData) => void;
  logger: Pick<Console, 'log'>;
}

export const defaultDeps: ScraperDeps = {
  downloadHtml,
  formatHtml,
  getUrl,
  getNextPageUrl,
  parseRankList,
  parseNovelCatalog,
  saveAsFile,
  logger: console,
};

export const createScraper = (deps: ScraperDeps = defaultDeps) => {
  const scrapeChapter = async (bookId: number, chapterId: number) => {
    const allLines: string[] = [];
    const pages: FormatData[] = [];
    const visited = new Set<string>();
    let currentUrl = deps.getUrl(bookId, chapterId);

    for (let i = 0; i < 20 && currentUrl; i += 1) {
      if (visited.has(currentUrl)) break;
      visited.add(currentUrl);
      deps.logger.log(`抓取第${i + 1}页: ${currentUrl}`);
      const html = await deps.downloadHtml(currentUrl);
      const formatData = await deps.formatHtml(html);
      pages.push(formatData);
      allLines.push(...formatData.context);

      const next = formatData.baseInfo.url_next;
      if (!next || next === '#') break;
      const nextUrl = deps.getNextPageUrl(next);
      if (!nextUrl || nextUrl === currentUrl) break;
      currentUrl = nextUrl;
    }

    const uniqueLines = allLines.filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1]);
    if (uniqueLines.length === 0) throw new Error('解析失败: 未提取到章节正文');

    const outputName = `${bookId}_${chapterId}`;
    deps.saveAsFile(outputName, uniqueLines.join('\n'), {
      baseInfo: pages[0]?.baseInfo ?? EMPTY_BASE_INFO,
      context: uniqueLines,
    });
    deps.logger.log(`success: 输出 out/${outputName}.txt 与 out/${outputName}.json`);
  };

  const scrapeRank = async (rankUrl: string) => {
    const html = await deps.downloadHtml(rankUrl);
    const rankItems = deps.parseRankList(html);
    if (rankItems.length === 0) throw new Error('榜单解析失败: 未找到小说条目');

    deps.saveAsFile('rank_list', JSON.stringify(rankItems, null, 2), {
      baseInfo: EMPTY_BASE_INFO,
      context: rankItems.map((item, i) => `${i + 1}. ${item.title} ${item.url}`),
    });
    deps.logger.log(`success: 输出 out/rank_list.txt 与 out/rank_list.json，共 ${rankItems.length} 条`);
  };

  const scrapeCatalog = async (catalogUrl: string) => {
    const html = await deps.downloadHtml(catalogUrl);
    const catalog = deps.parseNovelCatalog(html);
    if (catalog.catalog.length === 0) throw new Error('目录解析失败: 未找到章节条目');

    deps.saveAsFile('catalog', `${catalog.novelTitle}\n\n${catalog.catalog.map((item, i) => `${i + 1}. ${item.chapterTitle} ${item.chapterUrl}`).join('\n')}`, {
      baseInfo: EMPTY_BASE_INFO,
      context: catalog.catalog.map((item) => `${item.chapterTitle} ${item.chapterUrl}`),
    });
    deps.logger.log(`success: 输出 out/catalog.txt 与 out/catalog.json，共 ${catalog.catalog.length} 章`);
  };

  return { scrapeChapter, scrapeRank, scrapeCatalog };
};
