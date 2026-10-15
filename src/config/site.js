/**
 * 唯一需要修改的站点配置。
 *
 * 1. 改 profile 与 title 等基本信息。
 * 2. 把你的 Markdown 放在 src/content/，在 workspace 中登记文件或文件夹。
 * 3. 把 PDF / 图片放在 public/files/，通过 asset 引用。
 * 4. 所有文件名和路径大小写敏感；配置错误会在构建时提示。
 *
 * 文件树是展示用的虚拟工作区，不会读写访问者的真实文件系统。
 */
export const SITE = {
  title: '个人主页 · VS Code 风格',
  description: '一个支持浏览、预览和本地编辑的 VS Code 风格个人主页',
  language: 'zh-CN',
  initialFile: 'README.md',

  profile: {
    name: '张三',
    initials: '张',
    role: '前端开发工程师',
    city: '杭州',
    repo: 'homepage',
    branch: 'main',
  },

  // file 对应 src/content/ 下的相对路径；as 控制工作区中显示的文件名。
  // asset 对应 public/ 下的相对路径。
  workspace: [
    { file: 'readme.md', as: 'README.md' },
    { file: '终端命令.md' },
    {
      folder: '个人信息',
      children: [
        { file: '关于我.md' },
        { file: '技能特长.md' },
        { file: '联系方式.md' },
      ],
    },
    {
      folder: '经历与作品',
      children: [
        { file: '项目经历.md' },
        { file: '教育背景.md' },
      ],
    },
    { asset: 'files/简历.pdf', as: '简历.pdf', kind: 'pdf' },
    { asset: 'files/示例图片.svg', as: '示例图片.svg', kind: 'image' },
  ],
};
