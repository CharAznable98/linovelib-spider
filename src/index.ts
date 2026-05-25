import { parseCliArgs } from './cli';
import { createScraper } from './core/scraper';

const run = async (argv = process.argv) => {
  const cli = parseCliArgs(argv);
  const scraper = createScraper();

  if (cli.mode === 'rank') {
    await scraper.scrapeRank(cli.url!);
    return;
  }

  if (cli.mode === 'catalog') {
    await scraper.scrapeCatalog(cli.url!);
    return;
  }

  await scraper.scrapeChapter(cli.bookId!, cli.chapterId!);
};

export default run;
