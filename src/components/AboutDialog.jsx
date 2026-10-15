import React from 'react';

const SHORTCUTS = [
  ['Ctrl + Shift + P / F1', '打开命令面板'],
  ['Ctrl + P', '快速按文件名打开'],
  ['Ctrl + B', '显示 / 隐藏侧边栏'],
  ['Ctrl + `', '切换底部终端面板'],
  ['Ctrl + Shift + F', '搜索整个工作区'],
  ['Ctrl + S', '保存到本浏览器；草稿则下载副本'],
  ['Ctrl + W', '关闭当前标签页'],
  ['Ctrl + N', '新建草稿'],
  ['Ctrl + O', '打开本地文件（.md / .txt / .pdf）'],
  ['Ctrl + Shift + Tab / Ctrl + Tab', '切换编辑器标签页'],
  ['拖动标签到其他位置', '拆分出多个编辑器组；拖动组间分隔条调整大小'],
];

export default function AboutDialog({ onClose }) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="about-box">
        <h2 className="about-title">
          <span className="ee-logo about-logo">&lt;/&gt;</span>
          个人主页 · 仿 VS Code
        </h2>
        <p className="about-ver">版本 0.1.0 —— 一个长得像 VS Code 的个人主页</p>
        <p className="about-desc">
          页面致敬 Visual Studio Code（不是真实 IDE）。Markdown 可以在浏览器中编辑，
          使用命令显式打开预览。按 Ctrl+S 会把仓库内文件保存到此浏览器的本地存储；
          草稿可下载副本。所有操作都不会直接修改 Git 仓库或访客原始磁盘文件。
        </p>

        <h3 className="about-h">如何替换成你自己的内容</h3>
        <ul className="about-list">
          <li>
            <code>src/content/*.md</code> —— 所有 Markdown 文档，直接编辑保存即可
          </li>
          <li>
            <code>public/files/简历.pdf</code> —— 覆盖成你的真实简历（文件名不用改）
          </li>
          <li>
            <code>src/config/site.js</code> —— 集中修改站点信息和虚拟文件树
          </li>
        </ul>

        <h3 className="about-h">快捷键</h3>
        <table className="about-table">
          <tbody>
            {SHORTCUTS.map(([k, d]) => (
              <tr key={k}>
                <td>
                  <kbd>{k}</kbd>
                </td>
                <td>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="about-tech">React · Vite · Marked · highlight.js · pdfkit</p>
        <button className="ee-btn primary about-close" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  );
}
