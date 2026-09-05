/**
 * ============================================================
 *  终端命令配置规范（Terminal Command Spec）
 * ============================================================
 *
 *  底部"终端"面板的命令全部由下面的 TERMINAL_COMMANDS 决定。
 *  想加 / 改命令，只需编辑这个数组。
 *
 *  ── 每个命令对象的字段 ─────────────────────────────
 *  name    命令名（小写，唯一）。用于在终端输入。
 *  desc    help 列表里对这一命令的一句话说明
 *  usage   （可选）用法提示，例如 'open <文件名>'；不填则显示 name
 *  aliases （可选）别名数组，例如 ['cls', 'dir']
 *  run(arg, ctx)  命令主体：一个普通 JS 函数
 *        arg   —— 第一个参数之后的全部内容（字符串）。如 `open 关于我.md` 的 "关于我.md"
 *        ctx   —— 上下文对象：{ open, files, profile }
 *                 open(node)     打开左侧文件树里的文件（传 ALL_FILES 里的节点）
 *                 files          所有文件节点数组
 *                 profile        站主信息（姓名/职业/城市等）
 *
 *  ── run 的返回值（支持简单 JS，只做演示，无沙箱）─────
 *    '字符串'                          -> 一行普通文本
 *    ['多行', '文本']                  -> 多行（元素可以是字符串或 {text, dim}）
 *    [{ text: 'a', dim: true }, 'b']   -> 支持 dim:true 的灰色行
 *    { clear: true }                  -> 清屏
 *    undefined / null                  -> 无输出
 *
 *  ── 示例（带 JS 计算）──────────────────────────────
 *    greet:  hello <名字>  ->  你好，<名字>！
 *    sum:    sum <a> <b>   ->  a + b = 结果   （演示用 JS 做数学计算）
 * ============================================================
 */

/** help 命令：动态列出所有命令 */
const buildHelp = () =>
  TERMINAL_COMMANDS.map((c) => ({
    text: `  ${(c.usage || c.name).padEnd(14)} ${c.desc}`,
  }));

export const TERMINAL_COMMANDS = [
  {
    name: 'help',
    desc: '显示本帮助',
    aliases: ['?'],
    run: () => buildHelp(),
  },
  {
    name: 'ls',
    desc: '列出项目文件',
    aliases: ['dir'],
    run: (arg, ctx) => [
      { dim: true, text: '目录：C:\\Users\\Kevin\\homepage（模拟）' },
      ...ctx.files.map((f) => ({
        text: `  ${f.path.replace(/^\//, '')}`,
        dim: f.kind !== 'md',
      })),
    ],
  },
  {
    name: 'open',
    desc: '打开左侧文件树中的文件',
    usage: 'open <文件名>',
    run: (arg, ctx) => {
      if (!arg) return [{ text: '用法：open <文件名>，例如 open 关于我.md' }];
      const hit = ctx.files.find(
        (f) => f.name === arg || f.name.includes(arg) || f.path.replace(/^\//, '').includes(arg),
      );
      if (!hit) return [{ text: `找不到文件：${arg}（可用 ls 查看）` }];
      ctx.open(hit);
      return [{ text: `已打开：${hit.path.replace(/^\//, '')}` }];
    },
  },
  {
    name: 'skills',
    desc: '查看技能简介',
    run: (arg, ctx) => [
      { text: `${ctx.profile.name} · ${ctx.profile.role}` },
      {
        dim: true,
        text: '擅长：JavaScript / TypeScript、React、CSS 动画、工程化。更多请打开 技能特长.md',
      },
    ],
  },
  {
    name: 'contact',
    desc: '查看联系方式',
    run: () => [{ text: '联系方式在 个人信息/联系方式.md 里，或直接问我 😄' }],
  },
  {
    name: 'whoami',
    desc: '显示我是谁',
    run: (arg, ctx) => [
      { text: `${ctx.profile.name}@${ctx.profile.repo}` },
      { dim: true, text: `${ctx.profile.role} · 坐标${ctx.profile.city}` },
    ],
  },
  {
    name: 'pwd',
    desc: '当前目录',
    run: () => [{ text: 'C:\\Users\\Kevin\\homepage' }],
  },
  {
    name: 'date',
    desc: '现在几点',
    run: () => [{ text: new Date().toLocaleString('zh-CN', { hour12: false }) }],
  },
  {
    name: 'echo',
    desc: '复读机',
    usage: 'echo <内容>',
    run: (arg) => [{ text: arg || '(空)' }],
  },
  /* ---- 以下两个是"简单 JS"示例，可直接删掉或改成你的命令 ---- */
  {
    name: 'greet',
    desc: '打招呼（示例：简单 JS）',
    usage: 'greet <名字>',
    run: (arg) => [`你好，${arg || '世界'}！`],
  },
  {
    name: 'sum',
    desc: '两数求和（示例：简单 JS 计算）',
    usage: 'sum <a> <b>',
    run: (arg) => {
      const [a, b] = arg.split(/\s+/).map(Number);
      if ([a, b].some((n) => Number.isNaN(n))) return [{ text: '用法：sum <a> <b>，例如 sum 3 5' }];
      return [`${a} + ${b} = ${a + b}`];
    },
  },
  {
    name: 'clear',
    desc: '清屏',
    aliases: ['cls'],
    run: () => ({ clear: true }),
  },
];

/* ==================== 执行器（终端面板调用） ==================== */

function findCommand(name) {
  for (const c of TERMINAL_COMMANDS) {
    if (c.name.toLowerCase() === name) return c;
    if (c.aliases && c.aliases.includes(name)) return c;
  }
  return null;
}

function toOutput(out) {
  if (out && out.clear === true) return { clear: true, lines: [] };
  if (out === undefined || out === null) return { clear: false, lines: [] };
  if (typeof out === 'string') return { clear: false, lines: [{ text: out }] };
  if (Array.isArray(out)) {
    return {
      clear: false,
      lines: out.map((o) => (typeof o === 'string' ? { text: o } : o)),
    };
  }
  return { clear: false, lines: [{ text: String(out) }] };
}

/** 解析一行命令并执行，返回 { lines, clear } */
export function runTerminalCommand(raw, ctx) {
  const input = (raw || '').trim();
  if (!input) return { clear: false, lines: [''] };

  const parts = input.split(/\s+/);
  const head = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');
  const cmd = findCommand(head);

  if (!cmd) {
    return {
      clear: false,
      lines: [
        {
          text: `${head} : 无法将“${head}”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。`,
          dim: true,
        },
        { text: '输入 help 查看可用命令。' },
      ],
    };
  }

  try {
    return toOutput(cmd.run(arg, ctx));
  } catch (e) {
    return {
      clear: false,
      lines: [{ text: `执行出错：${e && e.message ? e.message : e}`, dim: true }],
    };
  }
}
