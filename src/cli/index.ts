export type CliMode = 'browse';

export interface CliOptions {
  mode: CliMode;
}

export const parseCliArgs = (argv: string[]): CliOptions => {
  const [, , modeArg = 'browse'] = argv;
  if (modeArg !== 'browse') {
    throw new Error(`未知模式: ${modeArg}，仅支持 browse`);
  }
  return { mode: 'browse' };
};
