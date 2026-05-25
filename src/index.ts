import { parseCliArgs } from './cli';
import { promptSelect } from './cli/interactive';
import { createScraper } from './core/scraper';

const run = async (argv = process.argv) => {
  const cli = parseCliArgs(argv);
  const scraper = createScraper();
  const list = cli.source === 'search'
    ? await scraper.listFromSearch(cli.keyword!)
    : await scraper.listFromRank('https://w.linovelib.com/topfull/allvisit/1.html');

  if (list.length === 0) throw new Error('未找到可选书籍');

  if (cli.action === 'list') {
    const pickedInList = await promptSelect(
      '请选择一本小说（仅浏览，不触发抓取）',
      list.slice(0, 20).map((item, idx) => ({ label: `${idx + 1}. ${item.title}`, value: item.url, description: item.url }))
    );

    if (pickedInList) {
      console.log(`已选择: ${pickedInList}`);
    }
    return;
  }

  let picked = cli.pick ? list[cli.pick - 1] : undefined;
  if (!picked) {
    const selectedUrl = await promptSelect(
      '请选择一本小说',
      list.slice(0, 20).map((item, idx) => ({ label: `${idx + 1}. ${item.title}`, value: item.url, description: item.url }))
    );
    picked = list.find((item) => item.url === selectedUrl);
  }

  if (!picked) throw new Error(`选择无效: ${cli.pick}`);

  if (cli.action === 'catalog') {
    await scraper.scrapeCatalog(picked.url);
    return;
  }

  await scraper.scrapeBook(picked.url);
};

export default run;
