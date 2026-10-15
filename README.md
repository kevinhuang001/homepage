# VS Code 风格个人主页

一个可配置的 React + Vite 静态主页。左侧资源管理器、标签编辑器组、Markdown 源码与预览、文件搜索、命令面板、演示终端组成访客可交互的工作区。

> **它不是完整 VS Code，也不是服务器文件编辑器。** 站点文件来自 Git 仓库。访客在浏览器中的修改仅能保存到自己的浏览器存储，或者下载到本地，不会修改仓库代码。

## 快速开始

需要 Node.js 20.19+ 或 22.12+（按 Vite 版本要求）。

```bash
npm ci
npm run dev
npm test
npm run build
```

## 只改一个配置文件

1. 打开 [`src/config/site.js`](src/config/site.js)，修改 `title`、`description`、`profile` 和 `workspace`。
2. Markdown 文件放在 `src/content/`，例如 `src/content/论文.md`，然后在 `workspace` 增加 `{ file: '论文.md' }`。也可以添加文件夹 `{ folder: '研究', children: [{ file: '论文.md' }] }`。
3. PDF、图片等静态资源放在 `public/files/`，例如 `{ asset: 'files/cv.pdf', as: '简历.pdf', kind: 'pdf' }`。
4. 站点欢迎页是 `src/content/readme.md`；替换目录内示例文本、头像、PDF 即可。
5. 如需调整模拟终端的可用命令，编辑 `src/data/terminal.js`。

### 文件示例

```js
{
  folder: '我的作品',
  children: [
    { file: '项目经历.md' },
    { asset: 'files/演示.svg', as: '演示.svg', kind: 'image' }
  ]
}
```

`file` 指向 `src/content/` 内文件，`asset` 指向 `public/` 内文件。路径区分大小写；不能用访客编辑结果替代修改源码。

## GitHub Pages：无需手工运行部署命令

仓库内置 `.github/workflows/build-pages.yml`。每次 `main` 源码更新，Actions 自动：

1. `npm ci` / `npm test` / `npm run build`；
2. 将完整静态文件提交到本仓库 **`docs/`**（含 `.nojekyll`）；
3. GitHub Pages 可从这个目录提供服务。

在 GitHub 仓库 **Settings → Pages → Build and deployment** 中，选择 **Deploy from a branch**，Branch 选 **`main`**，Folder 选 **`/docs`**，点击 Save。随后地址一般是 `https://<你的用户名>.github.io/<仓库名>/`。

如 Actions 无法提交 `docs/`，请到 **Settings → Actions → General → Workflow permissions** 允许 **Read and write permissions**。推送代码后先看 Actions 工作流执行结果；`docs/` 出现后再启用 Pages 即可。

Vite 配置使用相对路径 `base: './'`，支持项目子路径部署。如果更换网站域名、仓库名，通常无需改 Vite。

## 实际交互边界

- `Ctrl+P` 快速打开文件，`Ctrl+Shift+P` / `F1` 执行命令；`Ctrl+Shift+F` 全局搜索；`Ctrl+Shift+E` 文件树。
- 编辑器支持多个拆分组、关闭与拖动标签、Markdown 源码、显式侧边预览。
- `Ctrl+S` 将仓库内 Markdown 当前内容保存在**该浏览器本地**（本地文件/草稿可下载副本）；不会提交 Git。
- 本页的“终端”只执行白名单演示命令，不执行系统 shell。新建文件与拖入本地文件不会上传到服务器。
- `npm test` 包含核心编辑器组操作回归用例；GitHub Actions 同时运行测试和构建。

## 目录

| 路径 | 职责 |
| --- | --- |
| `src/config/site.js` | 个人信息、站点文案、文件树声明 |
| `src/content/` | 可展示的 Markdown 文档 |
| `src/data/vfs.js` | 通过配置生成虚拟文件树 |
| `src/lib/editors.js` | 编辑器组树纯函数 |
| `src/components/` | 页面各交互组件 |
| `tests/` | 核心回归测试 |
| `docs/` | Actions 生成的可直接发布静态页面 |

你可以 Fork 项目并替换示例内容；复用时请尊重原仓库的授权说明。VS Code 是 Microsoft 的产品；本项目只致敬其工作区交互与外观。
