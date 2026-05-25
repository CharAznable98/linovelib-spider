import cheerio from 'cheerio';

import { ChapterListItem, FormatData, NovelCatalog, PageBaseInfo, RankNovelItem } from '../types';

const getTargetFromInfoStr = (target: string, infoStr: string) => {
    const regexp = RegExp(`${target}:'(.*?)'[,}]`);
    const res = regexp.exec(infoStr);
    if (!Array.isArray(res) || !res[1]) {
        return '';
    }
    return res[1];
};

const getPageBaseInfo = (html: string): PageBaseInfo => {
    const baseInfo: PageBaseInfo = {
        url_previous: '',
        url_next: '',
        url_index: '',
        url_articleinfo: '',
        url_image: '',
        url_home: '',
        articleid: '',
        articlename: '',
        subid: '',
        author: '',
        chapterid: '',
        page: '',
        chaptername: '',
    };
    const regexp = /ReadParams\s*=\s*\{[\s\S]*?\}/;
    const infoStrArr = regexp.exec(html);
    if (Array.isArray(infoStrArr)) {
        const infoStr = infoStrArr[0];
        (Object.keys(baseInfo) as Array<keyof PageBaseInfo>).forEach((item) => {
            baseInfo[item] = getTargetFromInfoStr(item, infoStr);
        });
    }
    return baseInfo;
};

const cleanText = (text: string) =>
    text
        .replace(/\r/g, '')
        .replace(/\u3000/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim();

const getContextFromHtml = (html: string): string[] => {
    const $ = cheerio.load(html);
    const contentRoot = $('#acontent').first().length
        ? $('#acontent').first()
        : $('.mlfy_main_text').first().length
          ? $('.mlfy_main_text').first()
          : $('#TextContent').first();

    if (!contentRoot.length) {
        return [];
    }

    contentRoot.find('script,ins,iframe,.adsbygoogle,style').remove();

    return contentRoot
        .find('p,div')
        .map((_, el) => cleanText($(el).text()))
        .toArray()
        .filter((item) => Boolean(item) && !item.includes('最新网址'))
        .filter((item) => !item.includes('请记住本书首发域名'))
        .filter((item) => !item.includes('沒有可閱讀的章節'));
};

const getContextFromMetaDescription = (html: string): string[] => {
    const $ = cheerio.load(html);
    const desc = $('meta[name="description"]').attr('content') || '';
    if (!desc.includes('在线阅读：')) {
        return [];
    }

    return desc
        .split('在线阅读：')[1]
        .split('...')[0]
        .split('\n')
        .map((line) => cleanText(line))
        .filter((line) => Boolean(line));
};

const getContextFromJinaMarkdown = (rawText: string): string[] => {
    const marker = 'Markdown Content:';
    const markerIdx = rawText.indexOf(marker);
    if (markerIdx < 0) {
        return [];
    }

    return rawText
        .slice(markerIdx + marker.length)
        .split('\n')
        .map((line) => cleanText(line))
        .filter(
            (line) =>
                Boolean(line) &&
                !line.startsWith('Title:') &&
                !line.startsWith('URL Source:') &&
                !line.startsWith('Published Time:')
        );
};

export const formatHtml = async (html: string): Promise<FormatData> => {
    const baseInfo = getPageBaseInfo(html);
    const contextFromHtml = getContextFromHtml(html);
    const contextFromMeta = contextFromHtml.length > 0 ? [] : getContextFromMetaDescription(html);
    const context =
        contextFromHtml.length > 0
            ? contextFromHtml
            : contextFromMeta.length > 0
              ? contextFromMeta
              : getContextFromJinaMarkdown(html);

    return {
        baseInfo,
        context,
    };
};


const extractMarkdownLinks = (text: string): Array<{ title: string; href: string }> => {
    const links: Array<{ title: string; href: string }> = [];
    const regexp = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g;
    let match: RegExpExecArray | null = regexp.exec(text);
    while (match) {
        links.push({ title: cleanText(match[1]), href: cleanText(match[2]) });
        match = regexp.exec(text);
    }
    return links;
};

export const parseNovelCatalog = (html: string): NovelCatalog => {
    const $ = cheerio.load(html);
    const novelTitle = cleanText($('h1').first().text()) || cleanText($('title').first().text());
    const seen = new Set<string>();

    const markdownLinks = extractMarkdownLinks(html);

    const htmlLinks: ChapterListItem[] = $('a[href*="/novel/"]')
        .map((_, el) => {
            const title = cleanText($(el).text());
            const href = ($(el).attr('href') || '').trim();
            if (!title || !href || !/\/novel\/\d+\/(vol_\d+|\d+(_\d+)?)\.html/.test(href)) {
                return null;
            }
            const url = href.startsWith('http') ? href : `https://w.linovelib.com${href}`;
            const key = `${title}@@${url}`;
            if (seen.has(key)) {
                return null;
            }
            seen.add(key);
            return { chapterTitle: title, chapterUrl: url };
        })
        .toArray()
        .filter((item): item is ChapterListItem => Boolean(item));

    const mdLinks: ChapterListItem[] = markdownLinks
        .map((item) => {
            if (!/\/novel\/\d+\/(vol_\d+|\d+(_\d+)?)\.html/.test(item.href)) {
                return null;
            }
            const url = item.href.startsWith('http') ? item.href : `https://w.linovelib.com${item.href}`;
            const key = `${item.title}@@${url}`;
            if (seen.has(key)) {
                return null;
            }
            seen.add(key);
            return { chapterTitle: item.title, chapterUrl: url };
        })
        .filter((item): item is ChapterListItem => Boolean(item));

    const rawUrlMatches = html.match(/https?:\/\/[^\s)]+\/novel\/\d+\/(vol_\d+|\d+(_\d+)?)\.html/g) || [];
    const rawUrlLinks: ChapterListItem[] = rawUrlMatches
        .map((url) => {
            const key = `url@@${url}`;
            if (seen.has(key)) {
                return null;
            }
            seen.add(key);
            return { chapterTitle: url.split('/').pop() || url, chapterUrl: url };
        })
        .filter((item): item is ChapterListItem => Boolean(item));

    return { novelTitle, catalog: [...htmlLinks, ...mdLinks, ...rawUrlLinks] };
};

export const parseRankList = (html: string): RankNovelItem[] => {
    const $ = cheerio.load(html);
    const seen = new Set<string>();

    const htmlRank = $('a[href*="/novel/"]')
        .map((_, el) => {
            const href = ($(el).attr('href') || '').trim();
            const title = cleanText($(el).attr('title') || $(el).text());
            if (!href || !title || !/\/novel\/\d+(\.html)?$/.test(href)) {
                return null;
            }
            const url = href.startsWith('http') ? href : `https://w.linovelib.com${href}`;
            if (seen.has(url)) {
                return null;
            }
            seen.add(url);
            const cover = $(el).find('img').attr('src');
            return {
                title,
                url,
                cover: cover ? (cover.startsWith('http') ? cover : `https:${cover}`) : undefined,
            };
        })
        .toArray()
        .filter((item) => Boolean(item)) as RankNovelItem[];

    const markdownRank = extractMarkdownLinks(html)
        .map((item) => {
            if (!/\/novel\/\d+(\.html)?$/.test(item.href)) {
                return null;
            }
            const url = item.href.startsWith('http') ? item.href : `https://w.linovelib.com${item.href}`;
            if (seen.has(url)) {
                return null;
            }
            seen.add(url);
            return { title: item.title, url };
        })
        .filter((item): item is RankNovelItem => Boolean(item));

    return [...htmlRank, ...markdownRank];
};
