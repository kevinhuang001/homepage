import React from 'react';

const SHORTCUTS = [
  ['Ctrl + Shift + P / F1', '打开命令面板'],
  ['Ctrl + P', '转到文件（同样打开命令面板）'],
  ['Ctrl + B', '显示 / 隐藏侧边栏'],
  ['Ctrl + `', '切换底部终端面板'],
  ['Ctrl + F', '打开搜索视图'],
  ['Ctrl + S', '保存当前文件（演示 · 不会写入磁盘）'],
  ['Ctrl + W', '关闭当前标签页'],
  ['Ctrl + N', '新建草稿'],
  ['Ctrl + O', '打开本地文件（.md / .txt / .pdf）'],
  ['Alt + ← / →', '切换上一个 / 下一个标签页'],
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
          界面致敬 Visual Studio Code（仅外观相似，非真实编辑器）。Markdown 文件可以在页面里
          <strong>直接编辑</strong>并实时预览 —— 但内容只保存在当前页面的内存里，刷新即消失，
          不会真的写入磁盘（源码文件依然是那几个 <code>*.md</code>，想永久修改请编辑它们）。
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
