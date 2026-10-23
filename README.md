# 个人博客 · GitHub Pages 上传目录

**只将本文件所在的整个文件夹作为 GitHub 仓库根目录。** 不要再套一层 github-pages-upload；上传后仓库首页应直接看到 `site/`、`tools/`、`.github/` 和本 README。

这是从原 blog 项目整理的纯静态源码副本，含最新三篇介绍文章、音乐控件、动效与布局实验。原项目、后端、账号数据均保留在原位置。本目录不含后端、数据库、密钥、备份、虚拟环境、Hugo 二进制或生成网页。你只维护源码，GitHub Actions 自动构建和发布。

主题已改为**普通文件随仓库提交**，不需要子模块或额外下载主题；保持 Stack 4.0.3、原视觉和许可。版本来源见 [THEME_SOURCE.md](THEME_SOURCE.md)。Hugo Extended 固定0.168.0。

## 手动上传

在 GitHub 创建一个空仓库，建议 Public；不要勾选生成 README、.gitignore 或 LICENSE。本目录尚未初始化 Git，以下命令只在本目录运行，**不要在原 blog/ 中执行 git init**：

如果你已经有仓库：先确认是否为空。有提交历史的仓库应先 clone 到另一个空目录，再将本目录源码合入克隆目录，保留克隆产生的 .git，同名文件先审查合并；不要套用下面的新仓库初始化流程，也不要用强制 push 覆盖远程历史。

```powershell
cd 'C:\Users\Administrator\Desktop\self_website\github-pages-upload'
git init -b main
git add -A
git status --short
git diff --cached --stat
git diff --cached  # 审查源码；确认没有私人信息再提交
python tools/audit_git.py
git commit -m "Prepare personal blog for GitHub Pages"
```

如果 Git 提示缺少身份，按提示在此仓库设置你真实使用的 user.name 和 user.email，再提交。不要在命令或远程地址里写密码/令牌。

然后填写你实际创建的仓库地址：

```powershell
$repoUrl = '请替换为你的真实HTTPS仓库地址'
if (-not $repoUrl.StartsWith('https://github.com/')) { throw '请先填写真实仓库地址' }
git remote add origin $repoUrl
git push -u origin main
```

只有该目录确实尚无 .git 时才执行初始化；已经初始化过就从 git status 开始，不要重建仓库。若已有 origin，先 `git remote -v` 检查，不要重复添加或盲目覆盖。

在仓库 Settings → Pages → Build and deployment 中，将 Source 选择为 **GitHub Actions**。首次 push 若早于启用 Pages 而失败，启用后在 Actions 中重新运行 Hugo Pages。等待 build/deploy 成功，从部署环境或 Pages 设置里取得真实网址。Actions 自动获取正式 baseURL，兼容普通项目子路径；不填写虚构用户名、域名或 CNAME。

**不要上传生成的 site/public/。不要漏掉隐藏目录 .github/。** 推荐用上面的 Git 命令，避免网页上传漏掉工作流。这里不包含原 Git 历史；本次没有执行初始化、提交、远程设置、授权、push 或部署。

## 本地预览和以后更新

需要本地预览时安装 Python 3.12+（以及用于提交的 Git），执行：

```powershell
python tools/manage.py setup    # 下载固定 Hugo 到本目录 tools/hugo，核验 SHA256，不改全局环境
python tools/manage.py preview  # http://localhost:1313/project/，Ctrl+C停止
python tools/manage.py verify   # 两种路径、发布边界与分页检查
```

setup 下载步骤需要能访问官方 GitHub 发行页；GitHub Actions 使用独立的固定版本安装流程，无需上传你的本地工具。页面构建与运行不需要 Node 或后端。

文章修改 `site/content/post/`，图片放文章同目录；保留 content_id 和稳定 slug。个人信息/导航在 `site/hugo.toml`，关于/项目正文在 `site/content/page/`。播放器及动效在 `site/data/experience.json`；当前三首歌均无音源，不自动播放。取得授权后将实际文件放入 `site/static/audio/`，src填 `audio/文件名.mp3`，不加机器路径或仓库前缀。公开提交音频前确认允许公开分发。

以后以**本目录作为静态网站的维护入口**，修改后验证、git add、commit、push 即可，不必同时修改原 blog 和生成 HTML。原 blog 留作完整开发/后端保留项目，两者不会自动同步。不要把原项目整个覆盖复制回来，免得带入数据或恢复子模块配置。

正式模式隐藏账号/评论/留言，保留的前端动态扩展源码不代表功能已开放。独立实验位于网址的 `design-lab/`，不进主导航/搜索/RSS/sitemap，但知道路径的人可访问。布局切换不改变正式主题。

整理范围与本地验证见 [UPLOAD_REPORT.md](UPLOAD_REPORT.md)，资源许可见 [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md)。
