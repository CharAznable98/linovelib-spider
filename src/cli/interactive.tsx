import React, { FC, useEffect, useMemo, useState } from 'react';
import { Box, Text, render, useApp, useInput } from 'ink';
import { BrowseNovelItem } from '../core/scraper';

export interface InteractiveDatasource {
  loadRankPage: (page: number) => Promise<BrowseNovelItem[]>;
  search: (keyword: string) => Promise<BrowseNovelItem[]>;
  downloadBook: (bookUrl: string) => Promise<void>;
}

const PAGE_SIZE = 20;

type ViewMode = 'rank' | 'search';

const InteractiveBrowser: FC<{ datasource: InteractiveDatasource; onDone: () => void }> = ({ datasource, onDone }) => {
  const { exit } = useApp();
  const [mode, setMode] = useState<ViewMode>('rank');
  const [rankPage, setRankPage] = useState(1);
  const [input, setInput] = useState('');
  const [items, setItems] = useState<BrowseNovelItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState('正在加载榜单...');
  const [loading, setLoading] = useState(false);

  const loadRank = async (page: number) => {
    setLoading(true);
    setStatus(`正在加载榜单第 ${page} 页...`);
    const list = await datasource.loadRankPage(page);
    setItems(list);
    setSelected(0);
    setStatus(list.length === 0 ? '当前页没有数据' : `榜单第 ${page} 页，共 ${list.length} 条`);
    setLoading(false);
  };

  const runSearch = async (keyword: string) => {
    setLoading(true);
    setStatus(`正在搜索：${keyword}`);
    const list = await datasource.search(keyword);
    setItems(list);
    setSelected(0);
    setStatus(list.length === 0 ? `未找到：${keyword}` : `搜索“${keyword}”命中 ${list.length} 条`);
    setLoading(false);
  };

  useEffect(() => {
    void loadRank(1);
  }, []);

  useInput(async (value, key) => {
    if (loading) return;
    if (key.upArrow && items.length > 0) setSelected((old) => (old - 1 + items.length) % items.length);
    if (key.downArrow && items.length > 0) setSelected((old) => (old + 1) % items.length);

    if (key.leftArrow && mode === 'rank' && rankPage > 1) {
      const nextPage = rankPage - 1;
      setRankPage(nextPage);
      await loadRank(nextPage);
      return;
    }
    if (key.rightArrow && mode === 'rank') {
      const nextPage = rankPage + 1;
      setRankPage(nextPage);
      await loadRank(nextPage);
      return;
    }

    if (key.return) {
      if (mode === 'search') {
        const keyword = input.trim();
        if (!keyword) {
          setStatus('请输入搜索关键词后再回车');
          return;
        }
        await runSearch(keyword);
        return;
      }

      const picked = items[selected];
      if (!picked) {
        setStatus('当前无可下载书籍');
        return;
      }
      setLoading(true);
      setStatus(`开始下载：《${picked.title}》`);
      await datasource.downloadBook(picked.url);
      setLoading(false);
      setStatus(`下载完成：《${picked.title}》`);
      return;
    }

    if (value === 'q') {
      onDone();
      exit();
      return;
    }

    if (value === '/') {
      setMode('search');
      setInput('');
      setStatus('搜索模式：输入关键词并回车执行搜索，按 r 回到榜单');
      return;
    }

    if (value === 'r') {
      setMode('rank');
      setInput('');
      await loadRank(rankPage);
      return;
    }

    if (mode === 'search') {
      if (key.backspace || key.delete) {
        setInput((old) => old.slice(0, -1));
        return;
      }
      if (value && !key.ctrl && !key.meta) {
        setInput((old) => old + value);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text color="cyan">Linovelib 交互下载器</Text>
      <Text dimColor>方向键选择；Enter 下载；←/→ 翻页；/ 搜索；r 榜单；q 退出</Text>
      <Text>模式：{mode === 'rank' ? `榜单（第 ${rankPage} 页，每页 ${PAGE_SIZE} 条）` : '搜索'}</Text>
      {mode === 'search' ? <Text>关键词：{input || '（输入中）'}</Text> : null}
      <Text color={loading ? 'yellow' : 'green'}>{status}</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => (
          <Text key={`${item.url}-${i}`} color={selected === i ? 'green' : undefined}>
            {selected === i ? '❯' : ' '} {i + 1}. {item.title}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

export const runInteractiveBrowser = async (datasource: InteractiveDatasource): Promise<void> => new Promise((resolve) => {
  const App: FC = () => {
    const stableDatasource = useMemo(() => datasource, []);
    return <InteractiveBrowser datasource={stableDatasource} onDone={resolve} />;
  };

  const app = render(<App />);
  app.waitUntilExit().then(() => resolve());
});
