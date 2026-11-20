# 光影图鉴 · Photo Atlas

一个以照片为主的静态图鉴站：首页随机推荐、全部图鉴筛选、关键词搜索、分组详情与灯箱浏览。
纯前端，无后端、无数据库，构建产物可以直接丢到任何静态托管上。

技术栈：Vue 3 + TypeScript + Vite + Vue Router + Tailwind CSS v4 + Fuse.js + sharp。

详细的操作步骤（安装、添加照片、批量导入、部署、常见问题）见 **[使用说明.md](使用说明.md)**。

## 快速开始

```bash
npm install
npm run demo:gen   # 可选：生成 30 组共 88 张占位图
npm run dev        # http://127.0.0.1:5173
```

`npm run dev` 会先扫描 `content/entries`、生成缩略图和索引，再启动 Vite。

生产构建与本地预览：

```bash
npm run build      # 类型检查 + 打包到 dist/
npm run serve      # 用 Node 起一个带 history fallback 的静态服务器，默认 4173
```

## 目录结构

```
content/entries/<id>/      一组图鉴一个文件夹
  meta.json                标题、分类、标签、地点、简介、每张图的说明
  photos/01.jpg            原图，按文件名排序（也可直接放在条目根目录）
public/media/<id>/         构建产物：600 / 1600 两档 webp 缩略图
public/data/catalog.json   构建产物：轻量索引（标题/分类/标签/封面）
public/data/entries/*.json 构建产物：每组照片的详细清单
scripts/                   构建、示例数据、新建条目、静态预览
src/                       Vue 应用
```

## 添加一组真实照片

```bash
npm run new -- 2026-05-harbor "五月的港口"
```

然后把照片放进 `content/entries/2026-05-harbor/photos/`，按 `01.jpg`、`02.jpg` 命名，
再编辑 `meta.json`：

| 字段 | 说明 |
|---|---|
| `id` | 唯一 id，同时用作 URL，建议英文/数字/短横线 |
| `title` | 标题 |
| `category` | 分类，用于筛选 |
| `tags` | 标签数组，用于筛选和搜索 |
| `date` | 日期，`YYYY-MM-DD`，用于排序 |
| `location` | 拍摄地点 |
| `summary` | 一句话简介，显示在卡片和详情页 |
| `description` | 详情页正文，可换行 |
| `cover` | 封面文件名，默认 `01.jpg` |
| `captions` | 每张图的说明，键是文件名 |

改完运行 `npm run dev`，索引和缩略图会自动增量更新。

## 面向 800 张 / 300 组的几个设计

- **索引与详情分离**：首屏只加载 `catalog.json`（300 条约几十 KB），进入详情页才请求
  `data/entries/<id>.json`，不会把 800 条图片记录塞进首屏。
- **缩略图管线**：构建时用 sharp 生成 600px 和 1600px 两档 webp，网格用 600、灯箱用 1600；
  已生成且比原图新的会跳过，第二次构建很快。
- **图片可拆到 OSS**：设置 `PHOTO_MEDIA_BASE=https://img.example.com` 后，索引里的图片地址
  会写成绝对 URL，构建末尾自动删除 `dist/media`；`npm run media:upload` 负责上传缩略图。
- **分页**：全部图鉴每页 24 组，300 组共 13 页，配合图片懒加载。
- **原图不要进 Git**：`public/media` 是构建产物，已在 `.gitignore` 里；800 张原图很容易
  超过 GitHub 仓库限制。推荐本地 `npm run build` 后直接上传 `dist/`（Cloudflare Pages /
  阿里云 ESA Pages），原图只留在本地。
- **首次构建慢**：800 张图首次生成约 1600 张缩略图，视机器需要几分钟；之后增量。

## 想改的地方

- 首页随机数量：`src/pages/HomePage.vue` 里的 `pickEntries(..., 10, ...)`
- 首页彩蛋触发条件：`src/pages/HomePage.vue` 的 `EGG_TAP_THRESHOLD` / `EGG_TAP_WINDOW_MS`
  （短时间内连点「换一张」触发），弹窗文案在 `src/components/SlowDownDialog.vue`
- 每页数量：`src/pages/BrowsePage.vue` 的 `PAGE_SIZE`
- 主题色和字体：`src/style.css` 的 `@theme`
- 搜索权重：`src/lib/search.ts`

## 部署

`npm run build` 后的 `dist/` 是完整静态站点。使用 history 路由，托管平台需要把
未命中的路径回退到 `index.html`：

- Cloudflare Pages：直接上传 `dist/`（`npm run deploy:cf` 或拖拽 zip）；项目没有顶层
  `404.html` 时会自动做 SPA 回退，不需要 `_redirects`，详见 [使用说明.md](使用说明.md) 第 10 节
- 阿里云 ESA Pages：根目录的 `esa.jsonc` 已配好（构建 `npm run build`、输出 `./dist`、
  SPA 回退），GitHub 导入即可；文件数 2000 以内可以直接整站托管
- Netlify：自动处理 SPA，或加 `/* /index.html 200`
- Vercel：`rewrites` 到 `/index.html`
- Nginx：`try_files $uri $uri/ /index.html;`

如果希望直接双击 `index.html` 打开，把 `src/router.ts` 的 `createWebHistory` 改成
`createWebHashHistory` 即可。

## 示例数据

`npm run demo:gen` 生成 30 组、88 张占位图；`npm run demo:clean` 删除它们。
示例数据都带 `demo: true`，页脚会显示「示例数据」标记。
