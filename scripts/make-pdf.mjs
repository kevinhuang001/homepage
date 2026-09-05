/**
 * 生成示例简历 PDF —— public/files/简历.pdf
 * 用法：npm run make:pdf （或 node scripts/make-pdf.mjs）
 * 之后把「你的」真实简历直接覆盖 public/files/简历.pdf 即可，无需改动代码。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/files/简历.pdf');

// Windows 自带中文字体（SimHei 为单文件 .ttf，PDFKit 支持最稳）
const HEI = 'C:/Windows/Fonts/simhei.ttf';

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52; // 页边距
const CONTENT_W = A4_W - M * 2;

const ACCENT = '#007acc';
const DARK = '#24292e';
const GRAY = '#5a5a5a';
const LIGHT = '#c9d1d9';

const data = {
  name: '张 三',
  role: '前端开发工程师 · Web 全栈爱好者',
  contact: '邮箱：example@email.com　电话：+86 138 0000 0000　坐标：杭州',
  github: 'GitHub：github.com/zhangsan　博客：zhangsan.dev',
  intro:
    '4 年 Web 开发经验，擅长 React / TypeScript 与前端工程化，关注产品细节与性能体验；' +
    '有组件库、数据可视化与大型中后台项目经验，乐于把复杂问题拆简单。',
  work: [
    {
      org: '某大型互联网公司',
      title: '高级前端工程师',
      time: '2022.06 – 至今',
      points: [
        '负责核心中后台产品线，主导技术升级：Vue 2 → React 18 + TypeScript，首屏性能提升约 45%；',
        '搭建 Monorepo + Vite 工程体系，沉淀 20+ 可复用组件，支撑 6 条业务线并行迭代；',
        '推动代码规范与自动化：单元测试覆盖率从 12% 提升至 78%，线上缺陷率下降 60%。',
      ],
    },
    {
      org: '某创业公司',
      title: '前端开发工程师',
      time: '2021.06 – 2022.05',
      points: [
        '从 0 到 1 搭建公司官网与管理后台，月 PV 峰值 200w+；',
        '封装 ECharts 图表配置层，支撑数据大屏项目按期上线；',
        '独立负责 3 个客户定制小程序的前端交付。',
      ],
    },
  ],
  edu: [
    {
      school: '浙江大学 · 计算机科学与技术',
      degree: '本科 · 工学学士',
      time: '2018.09 – 2022.06',
      points: ['主修：数据结构、操作系统、计算机网络、数据库原理；连续三年获得校级奖学金。'],
    },
  ],
  skills: [
    { name: 'JavaScript / TypeScript', level: 0.95, note: '日常主力语言，类型驱动开发' },
    { name: 'React / Vue 及生态', level: 0.9, note: '组件化、状态管理、SSR/SSG' },
    { name: 'CSS / 动画 / 可视化', level: 0.85, note: '布局还原、动效细节、ECharts 封装' },
    { name: '工程化 / Node.js', level: 0.8, note: 'Vite、Webpack、CI/CD、接口联调' },
  ],
};

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: M, bottom: M, left: M, right: M },
  info: { Title: '张三 - 前端开发工程师简历（示例）', Author: 'homepage' },
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

doc.registerFont('hei', HEI);
doc.font('hei');

// 页脚（画在页边距以内，并防止 text() 触发换页导致递归）
let drawingFooter = false;
const footer = () => {
  if (drawingFooter) return;
  drawingFooter = true;
  try {
    const n = doc.bufferedPageRange().count + 1;
    const y = doc.page.height - doc.page.margins.bottom - 20;
    doc
      .fontSize(8)
      .fillColor(GRAY)
      .text('示例简历 —— 请用你的真实简历覆盖 public/files/简历.pdf', M, y, {
        width: CONTENT_W,
        align: 'center',
        lineBreak: false,
      });
    doc.text(`第 ${n} 页`, M, y, { width: CONTENT_W, align: 'right', lineBreak: false });
  } finally {
    drawingFooter = false;
  }
};
doc.on('pageAdded', footer);

const sectionTitle = (text) => {
  doc.moveDown(1.6);
  doc.fillColor(ACCENT).fontSize(13.5).text(text);
  const y = doc.y + 3;
  doc.moveTo(M, y).lineTo(M + CONTENT_W, y).lineWidth(1.2).strokeColor(ACCENT).stroke();
  doc.moveDown(0.9);
  doc.fillColor(DARK);
};

const bullet = (text, indent = 0) => {
  doc
    .fontSize(10)
    .fillColor(DARK)
    .text(text, M + indent, doc.y, {
      width: CONTENT_W - indent,
      lineGap: 3,
      bullet: { indent: 6 },
    });
  doc.moveDown(0.35);
};

/* ---------------- 头部 ---------------- */
doc
  .fontSize(28)
  .fillColor(DARK)
  .text(data.name, M, M + 6);
doc
  .fontSize(12.5)
  .fillColor(ACCENT)
  .text(data.role, M, doc.y + 4);
doc.moveDown(0.6);
doc
  .fontSize(9.5)
  .fillColor(GRAY)
  .text(data.contact, M, doc.y);
doc.text(data.github);
doc
  .fontSize(10)
  .fillColor(DARK)
  .text(data.intro, M, doc.y + 8, { lineGap: 4 });

/* ---------------- 工作经历 ---------------- */
sectionTitle('工作经历');
for (const job of data.work) {
  const y0 = doc.y;
  doc.fontSize(11.5).fillColor(DARK).text(`${job.org}｜${job.title}`, M, y0, {
    width: CONTENT_W,
    lineBreak: false,
  });
  doc.fontSize(9).fillColor(GRAY).text(job.time, M, y0 + 2, {
    width: CONTENT_W,
    align: 'right',
    lineBreak: false,
  });
  doc.y = y0 + 16;
  for (const p of job.points) bullet(`• ${p}`);
  doc.moveDown(0.5);
}

/* ---------------- 教育背景 ---------------- */
sectionTitle('教育背景');
for (const e of data.edu) {
  const y0 = doc.y;
  doc.fontSize(11.5).fillColor(DARK).text(`${e.school}｜${e.degree}`, M, y0, {
    width: CONTENT_W,
    lineBreak: false,
  });
  doc.fontSize(9).fillColor(GRAY).text(e.time, M, y0 + 2, {
    width: CONTENT_W,
    align: 'right',
    lineBreak: false,
  });
  doc.y = y0 + 16;
  for (const p of e.points) bullet(`• ${p}`);
}

/* ---------------- 专业技能（带进度条） ---------------- */
sectionTitle('专业技能');
const barH = 5;
for (const s of data.skills) {
  const rowY = doc.y;
  doc.fontSize(10).fillColor(DARK).text(s.name, M, rowY);
  doc.fontSize(8.5).fillColor(GRAY).text(s.note, M, rowY + 13, { width: CONTENT_W * 0.55 });
  const barX = M + CONTENT_W * 0.62;
  doc
    .roundedRect(barX, rowY + 2, CONTENT_W * 0.38, barH, 2.5)
    .fillColor('#e1e4e8')
    .fill();
  doc
    .roundedRect(barX, rowY + 2, CONTENT_W * 0.38 * s.level, barH, 2.5)
    .fillColor(ACCENT)
    .fill();
  doc.moveDown(2.4);
}

doc.moveDown(1);
bullet(
  '• 其他：Git 工作流、小程序、Chrome 插件、WebAssembly 入门；业余维护个人技术博客（30+ 篇原创）。',
);

footer();
doc.end();

stream.on('finish', () => {
  const size = fs.statSync(OUT).size;
  console.log(`✅ 已生成 ${OUT}（${(size / 1024).toFixed(1)} KB）`);
});
