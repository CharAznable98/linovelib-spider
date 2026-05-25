export type CliMode = 'chapter' | 'rank' | 'catalog';

export interface CliOptions {
  mode: CliMode;
  bookId?: number;
  chapterId?: number;
  url?: string;
}

export const parseCliArgs = (argv: string[]): CliOptions => {
  const [, , modeArg = 'chapter', arg1, arg2] = argv;
  const mode = modeArg as CliMode;

  if (!['chapter', 'rank', 'catalog'].includes(mode)) {
    throw new Error(`未知模式: ${modeArg}`);
  }

  if (mode === 'rank') {
    return { mode, url: arg1 ?? 'https://w.linovelib.com/topfull/allvisit/1.html' };
  }

  if (mode === 'catalog') {
    return { mode, url: arg1 ?? 'https://w.linovelib.com/novel/2013.html' };
  }

  const bookId = Number(arg1 ?? 2013);
  const chapterId = Number(arg2 ?? 72034);
  if (!Number.isFinite(bookId) || !Number.isFinite(chapterId)) {
    throw new Error('参数错误: chapter 模式下需要 bookId chapterId');
  }
  return { mode, bookId, chapterId };
};
