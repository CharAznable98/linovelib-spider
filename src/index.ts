import {
    downloadHtml,
    formatHtml,
    getNextPageUrl,
    getUrl,
    parseNovelCatalog,
    parseRankList,
    saveAsFile,
} from './utils';

const scrapeChapter = async (bookId: number, chapterId: number) => {
    const allLines: string[] = [];
    const pages = [];
    const visited = new Set<string>();
    let currentUrl = getUrl(bookId, chapterId);

    for (let i = 0; i < 20 && currentUrl; i += 1) {
        if (visited.has(currentUrl)) {
            break;
        }
        visited.add(currentUrl);
        console.log(`抓取第${i + 1}页: ${currentUrl}`);
        const html = await downloadHtml(currentUrl);
        const formatData = await formatHtml(html);
        pages.push(formatData);
        allLines.push(...formatData.context);

        const next = formatData.baseInfo.url_next;
        if (!next || next === '#') {
            break;
        }
        const nextUrl = getNextPageUrl(next);
        if (!nextUrl || nextUrl === currentUrl) {
            break;
        }
        currentUrl = nextUrl;
    }

    const uniqueLines = allLines.filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1]);

    if (uniqueLines.length === 0) {
        throw new Error('解析失败: 未提取到章节正文');
    }

    const outputName = `${bookId}_${chapterId}`;
    saveAsFile(outputName, uniqueLines.join('\n'), {
        baseInfo: pages[0]?.baseInfo,
        context: uniqueLines,
    });
    console.log(`success: 输出 out/${outputName}.txt 与 out/${outputName}.json`);
};

const scrapeRank = async (rankUrl: string) => {
    const html = await downloadHtml(rankUrl);
    const rankItems = parseRankList(html);
    if (rankItems.length === 0) {
        throw new Error('榜单解析失败: 未找到小说条目');
    }
    saveAsFile('rank_list', JSON.stringify(rankItems, null, 2), {
        baseInfo: {
            url_previous: '', url_next: '', url_index: '', url_articleinfo: '', url_image: '', url_home: '',
            articleid: '', articlename: '', subid: '', author: '', chapterid: '', page: '', chaptername: '',
        },
        context: rankItems.map((item, i) => `${i + 1}. ${item.title} ${item.url}`),
    });
    console.log(`success: 输出 out/rank_list.txt 与 out/rank_list.json，共 ${rankItems.length} 条`);
};

const scrapeCatalog = async (catalogUrl: string) => {
    const html = await downloadHtml(catalogUrl);
    const catalog = parseNovelCatalog(html);
    if (catalog.catalog.length === 0) {
        throw new Error('目录解析失败: 未找到章节条目');
    }
    saveAsFile(
        'catalog',
        `${catalog.novelTitle}\n\n${catalog.catalog
            .map((item, i) => `${i + 1}. ${item.chapterTitle} ${item.chapterUrl}`)
            .join('\n')}`,
        {
            baseInfo: {
                url_previous: '', url_next: '', url_index: '', url_articleinfo: '', url_image: '', url_home: '',
                articleid: '', articlename: '', subid: '', author: '', chapterid: '', page: '', chaptername: '',
            },
            context: catalog.catalog.map((item) => `${item.chapterTitle} ${item.chapterUrl}`),
        }
    );
    console.log(`success: 输出 out/catalog.txt 与 out/catalog.json，共 ${catalog.catalog.length} 章`);
};

const main = async () => {
    const [, , mode = 'chapter', arg1, arg2] = process.argv;

    if (mode === 'rank') {
        await scrapeRank(arg1 ?? 'https://w.linovelib.com/topfull/allvisit/1.html');
        return;
    }

    if (mode === 'catalog') {
        await scrapeCatalog(arg1 ?? 'https://w.linovelib.com/novel/2013.html');
        return;
    }

    const bookId = Number(arg1 ?? 2013);
    const chapterId = Number(arg2 ?? 72034);

    if (!Number.isFinite(bookId) || !Number.isFinite(chapterId)) {
        throw new Error('参数错误: chapter 模式下需要 bookId chapterId');
    }

    await scrapeChapter(bookId, chapterId);
};

export default main;
