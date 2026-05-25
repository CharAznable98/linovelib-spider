import request from 'request';

const Host = 'https://w.linovelib.com/novel';

export const getUrl = (bookIndex: number, index: number, suffix?: number) =>
    `${Host}/${bookIndex}/${index}${suffix ? '_' : ''}${
        suffix ? suffix : ''
    }.html`;

export const getNextPageUrl = (url_next: string) => {
    if (!url_next) {
        return '';
    }
    if (url_next.startsWith('http')) {
        return url_next;
    }
    return `https://w.linovelib.com${url_next}`;
};

const requestPage = (url: string) =>
    new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
        request(
            {
                url,
                timeout: 15000,
                gzip: true,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                    Referer: 'https://w.linovelib.com/',
                    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                },
            },
            (error, res, body) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    statusCode: res?.statusCode ?? 0,
                    body: typeof body === 'string' ? body : '',
                });
            }
        );
    });

const isChallengePage = (body: string) =>
    body.includes('Just a moment...') ||
    body.includes('challenges.cloudflare.com') ||
    body.includes('Attention Required!');

const getJinaAiUrl = (url: string) => {
    const noProtocolUrl = url.replace(/^https?:\/\//, '');
    return `https://r.jina.ai/http://${noProtocolUrl}`;
};

export const downloadHtml = async (url: string) => {
    try {
        const primaryRes = await requestPage(url);

        if (primaryRes.statusCode === 200 && primaryRes.body && !isChallengePage(primaryRes.body)) {
            return primaryRes.body;
        }

        const fallbackRes = await requestPage(getJinaAiUrl(url));
        if (fallbackRes.statusCode === 200 && fallbackRes.body) {
            return fallbackRes.body;
        }

        throw new Error(
            `主站与回退源均失败: primary=${primaryRes.statusCode}, fallback=${fallbackRes.statusCode}`
        );
    } catch (error) {
        throw new Error(`获取数据失败: ${(error as Error).message}`);
    }
};
