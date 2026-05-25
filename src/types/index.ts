export interface PageBaseInfo {
    url_previous: string;
    url_next: string;
    url_index: string;
    url_articleinfo: string;
    url_image: string;
    url_home: string;
    articleid: string;
    articlename: string;
    subid: string;
    author: string;
    chapterid: string;
    page: string;
    chaptername: string;
}

export interface FormatData {
    baseInfo: PageBaseInfo;
    context: string[];
}

export interface ChapterListItem {
    chapterTitle: string;
    chapterUrl: string;
}

export interface NovelCatalog {
    novelTitle: string;
    catalog: ChapterListItem[];
}

export interface RankNovelItem {
    title: string;
    url: string;
    cover?: string;
}
