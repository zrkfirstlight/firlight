# 主题与素材许可

| 内容 | 固定来源 | 许可/署名 |
| --- | --- | --- |
| Stack 主题、图标、样式与主题脚本 | CaiJimmy/hugo-theme-stack v4.0.3，提交 3e123a30b79b5d52a3a8e88a9dd678fcfd28e418 | GPL-3.0-only；保留 site/themes/stack/LICENSE、theme.toml 与主题页脚设计署名 |
| KaTeX 数学脚本、CSS | KaTeX/KaTeX v0.19.0 | 保留 site/static/vendor/katex/LICENSE（MIT）；随静态资源发布 |
| KaTeX 字体 | 同一发行版随库字体，未经改动 | 字体元数据声明 SIL OFL 1.1；保留 FONT_CREDITS.txt 中实际版权/RFN 和 OFL.txt 完整许可正文 |
| 文章 cover.svg、static/images/landscape.svg | 本项目绘制的几何示例插图 | 原创示例，无外部图库/旅行照片；随项目源码许可使用 |
| 本项目源码 | 根目录 LICENSE | GPL-3.0；真实文章/照片迁入时由拥有者另行明确内容授权，不自动虚构内容版权声明 |

没有接入外部付费图库、分析追踪或头像服务。主题 GPL 文件和 KaTeX 许可保留在提交中；主题页脚作者署名保持显示。Hugo 是构建工具，不把本地工具二进制提交到仓库。

2026-10-23 新增音乐控制器、Canvas 轨迹、CSS 蒙版光场和布局实验均为项目原创代码，遵循根目录 GPL-3.0；不增加运行时库、外部图片或字体。没有歌曲音频及歌手/封面授权资源。make_audio_fixture.py 生成的纯测试音仅在忽略的 artifacts/ 下，不进入站点或 Git，也不代表三首指定歌曲。

字体版权从实际 TTF name 表提取，不把软件的 MIT 误用为字体许可。OFL 正文与 [SIL 官方文本](https://openfontlicense.org/open-font-license-official-text/) 核对，下载取自 [SIL 官方字体仓库中的同版许可](https://github.com/silnrsi/font-charis/blob/master/OFL.txt)，仅取通用许可正文；版权/RFN 使用本项目字体自身元数据，不套用 Charis 的版权声明。

工作流 Action 固定提交来源：

- [checkout v7.0.1](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1)
- [configure-pages v6.0.0](https://github.com/actions/configure-pages/commit/45bfe0192ca1faeb007ade9deae92b16b8254a0d)
- [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/commit/fc324d3547104276b827a68afc52ff2a11cc49c9)
- [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/commit/368f82528645a54fb793d4d04e342629a3f51346)

以上只读取官方公开项目记录，未使用拥有者 GitHub 账号。固定版本减少构建漂移，仍需由拥有者在未来升级时审查变更。
