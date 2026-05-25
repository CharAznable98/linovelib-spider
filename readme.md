# 哔哩轻小说爬虫工具

## 设计目标

将哔哩轻小说抓取能力做成可复用核心模块，并通过 CLI 暴露为开箱即用命令行工具；后续可平滑接入 Web/API 等其它展示层。

## 架构说明

- `src/core/scraper.ts`：核心能力层（抓取章节、榜单、目录），通过依赖注入隔离网络/解析/存储实现。
- `src/cli/index.ts`：CLI 参数解析层（`chapter | rank | catalog`）。
- `src/index.ts`：应用编排入口（CLI -> core）。

## 使用方式

```bash
# 默认抓取 chapter（bookId=2013, chapterId=72034）
npm run start

# 抓取指定章节
npm run start -- chapter <bookId> <chapterId>

# 抓取榜单（可选自定义 URL）
npm run start -- rank [rankUrl]

# 抓取目录（可选自定义 URL）
npm run start -- catalog [catalogUrl]
```

运行成功后，文件将输出到 `out/` 目录（`*.txt` 与 `*.json`）。

## 开发与测试

```bash
# 类型检查
npm run build

# 编译
npm run compile

# 执行全部测试
npm test
```

当前测试覆盖：
- CLI 参数解析。
- 核心抓取流程（章节聚合去重、榜单输出、目录输出）。
