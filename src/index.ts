import { parseCliArgs } from './cli';
import { runInteractiveBrowser } from './cli/interactive';
import { createScraper } from './core/scraper';

const run = async (argv = process.argv) => {
  parseCliArgs(argv);
  const scraper = createScraper();

  await runInteractiveBrowser({
    loadRankPage: (page) => scraper.listFromRank(`https://w.linovelib.com/topfull/allvisit/${page}.html`),
    search: (keyword) => scraper.listFromSearch(keyword),
    downloadBook: (bookUrl) => scraper.scrapeBook(bookUrl),
  });
};

export default run;
