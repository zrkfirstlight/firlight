# Firlight · 个人博客

**自定义域名： https://zrk123.cn/** 。本次修复旧 /firlight/ 资源前缀导致的无样式问题；Actions固定构建production根路径。配置和排查见[域名说明](docs/DOMAIN_BINDING.md)。账号/评论仍关闭，不接入本机API。

Hugo Extended 0.168.0 + Stack 4.0.3 的中文个人博客源码。

- 网站：https://zrk123.cn/
- 仓库：https://github.com/zrkfirstlight/firlight
- 默认与发布分支：`2026blog`
- 发布方式：GitHub Actions 生成网页，通过 GitHub Pages 托管；无需手动维护 HTML。

此仓库是公开静态网站的实际维护/发布目录。完整开发与本机后端保留在独立开发工作区；数据库、密钥、备份、日志和本地工具不进入此仓库。此前上传包已初始化并关联远程，**不要重新 git init**。

## 更新网站

在此仓库工作区修改并检查源码，然后执行：

```powershell
git status --short --branch
python tools/manage.py verify
git diff
# 只添加本次需要发布的文件，检查暂存内容后再提交。
git add site README.md DEPLOYMENT.md
# 修改工作流或工具时，也显式添加对应文件。
git diff --cached --stat
git diff --cached
git commit -m "Update blog content"
git push origin 2026blog
```

若你在独立开发目录完成修改，先将对应的公开源码同步到此仓库；不要复制开发目录的 .git、后端、数据、public 或工具二进制，不覆盖此仓库的历史或人工修改。主题在这里为普通文件快照，在完整开发目录为子模块，勿互相覆盖其Git元数据。

每次推送2026blog会运行Hugo Pages；在Actions中检查build和deploy均成功，再打开网站检查。网站地址由Pages部署元数据传入，支持/firlight/子路径。不配置自定义域名或CNAME。

## 内容与本地预览

- 文章：site/content/post/；Markdown正文和图片同目录，保留content_id与稳定slug。
- 资料/导航：site/hugo.toml；关于/项目正文：site/content/page/。
- 音乐/动效：site/data/experience.json。三首曲目尚无音源；没有自动播放。
- 实验页：网站的design-lab/，与正式主题隔离，不进入主导航、搜索、RSS或站点地图。

```powershell
python tools/manage.py setup
python tools/manage.py preview
# 打开 http://localhost:1313/project/；Ctrl+C停止
```

setup在项目内取得固定Hugo并校验SHA256；不修改系统PATH，不安装Node或后端。已有工具时无需重复下载。当前production是纯静态，不开放登录/注册/评论/留言，也不请求本机服务。

部署配置与检查见[DEPLOYMENT.md](DEPLOYMENT.md)。主题来源见[THEME_SOURCE.md](THEME_SOURCE.md)，许可见[docs/THIRD_PARTY.md](docs/THIRD_PARTY.md)。UPLOAD_REPORT.md保留此前整理阶段的历史快照。

## 知识与生活空间更新（2026-10-23）

四类内容：随笔 site/content/post/、学习 site/content/notes/、发现 site/content/discovery/、项目 site/content/project/。topics 关联共同主题，series/weight 组织学习章节；永久 content_id 不随路径修改。首页文案与此刻面板在 site/data/desk.json；个人信息仍在 site/hugo.toml。原文章 /post/example-reading/ 保留。

新增 /learning/、/essays/、/discoveries/、快捷搜索 Ctrl/⌘K、手动阅读位置恢复和 /project/life-lab/ 生命游戏。设计实验仍在 /design-lab/，只供预览。音乐尚无授权音源，保持音源待配置。无真实内容的此刻/发现留白。详细约定见 docs/SPACE_DESIGN.md（其中本地动态命令属于独立完整开发工作区，本公开仓库不含后端）。

本次 production 继续关闭账号/评论/留言，不请求本机接口；以后接入动态服务必须先提供稳定 HTTPS API 并完成跨域验证。

## 写作与细节更新

电脑导入Markdown/UTF-8文本、手机短帖、网页编辑与可选作者后台方案见 [CONTENT_WORKFLOW.md](docs/CONTENT_WORKFLOW.md)。工具 `py -3 tools/new_post.py --title "标题" --slug unique-name` 默认草稿，不覆盖、不提交。手机模板在 templates/mobile-post.md，草稿进入公开Git仍可被读取。

新增四篇Effective Python原创实践，见学习书架；11段教学代码可用 `py -3 tools/verify_learning.py`核验。星幕、低频流星与纹样配置见 [DETAIL_UPDATE.md](docs/DETAIL_UPDATE.md)。读者账号不具备发文权限；未增加网页作者后台。
