import React from 'react';

const SHORTCUTS = [
  ['Ctrl + Shift + P / F1', '打开命令面板'],
  ['Ctrl + P', '转到文件（同样打开命令面板）'],
  ['Ctrl + B', '显示 / 隐藏侧边栏'],
  ['Ctrl + `', '切换底部终端面板'],
  ['Ctrl + F', '打开搜索视图'],
  ['Ctrl + W', '关闭当前标签页'],
  ['Ctrl + N', '新建草稿'],
  ['Ctrl + O', '打开本地文件（.md / .txt / .pdf）'],
  ['Alt + ← / →', '切换上一个 / 下一个标签页'],
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
          界面致敬 Visual Studio Code（仅外观相似，非真实编辑器）。本页没有后端的秘密，也没有 bug——真的。
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
            <code>src/data/vfs.js</code> —— 站主姓名 / 文件树结构 / 侧边栏“个人信息”
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
