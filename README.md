# Firlight · 个人博客

Hugo Extended 0.168.0 + Stack 4.0.3 的中文个人博客源码。

- 网站：https://zrkfirstlight.github.io/firlight/
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
