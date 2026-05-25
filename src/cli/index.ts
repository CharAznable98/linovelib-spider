export type CliMode = 'browse';

export interface CliOptions {
  mode: CliMode;
  source: 'rank' | 'search';
  keyword?: string;
  pick?: number;
  action: 'list' | 'catalog' | 'book';
}

export const parseCliArgs = (argv: string[]): CliOptions => {
  const [, , modeArg = 'browse', ...rest] = argv;
  if (modeArg !== 'browse') {
    throw new Error(`未知模式: ${modeArg}，仅支持 browse`);
  }

  const opts: CliOptions = { mode: 'browse', source: 'rank', action: 'list' };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    const next = rest[i + 1];
    if (token === '--source' && (next === 'rank' || next === 'search')) {
      opts.source = next;
      i += 1;
    } else if (token === '--keyword' && next) {
      opts.keyword = next;
      i += 1;
    } else if (token === '--pick' && next) {
      opts.pick = Number(next);
      i += 1;
    } else if (token === '--action' && (next === 'list' || next === 'catalog' || next === 'book')) {
      opts.action = next;
      i += 1;
    }
  }

  if (opts.source === 'search' && !opts.keyword) {
    throw new Error('参数错误: --source search 时必须提供 --keyword');
  }
  if (opts.pick !== undefined && (!Number.isFinite(opts.pick) || opts.pick < 1)) {
    throw new Error('参数错误: --pick 必须是大于等于 1 的数字');
  }
  return opts;
};
