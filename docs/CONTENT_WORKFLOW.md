# 电脑、手机与网页：如何更新这个网站

更新：2026-10-23。公开文章的源头是 Hugo Markdown，不是 SQLite。网页上的普通博客账号只管理评论，**不能发布或修改文章**。本轮没有把作者权限授予读者账号，也没有实现新的网页管理后台。

## 三种方式怎么选

| 场景 | 当前可以使用的方法 | 电脑关机时 |
| --- | --- | --- |
| 电脑认真写文、配图 | 开发目录写 Markdown → 本地预览 → 同步发布仓库 → Git push | 回到电脑后再发布 |
| 手机随手记几段 | 手机浏览器编辑 GitHub 仓库中的 Markdown，或先在自己的笔记应用记草稿 | GitHub Actions 仍能构建发布 |
| 网页上改错字、加文章 | GitHub 网页编辑器；多文件可用 github.dev | 不依赖本机后端 |
| 想登录自己的博客写文章 | 见本文末尾的可选后台设计；目前未实现 | 若后台在本机，关机时不能用 |

推荐目前使用前三种。它们共用一份源文件与 Git 历史，不维护第二套 HTML，也不需要新增服务器或把 GitHub 凭据塞进浏览器。

## 电脑：从一份文档开始

开发目录为 `C:/Users/Administrator/Desktop/self_website/blog`。新建随笔：

```powershell
Set-Location C:/Users/Administrator/Desktop/self_website/blog
py -3 tools/new_post.py --title "今天的一点观察" --slug today-observation
```

导入你已经写好的 UTF-8 Markdown 或文本正文（将示例路径换成真实路径）：

```powershell
py -3 tools/new_post.py --title "我的学习笔记" --slug my-study-note --kind notes --series "自己的学习专题" --from-file "C:/你的文档目录/正文.md"
```

工具只读取正文，不执行文件、不联网、不覆盖目录，默认 draft=true。导入前移除已有 front matter；已有站内文章直接编辑原文件，不要重新导入生成第二个 ID。Word .docx 请先另存为 UTF-8 文本或整理成 Markdown，再单独放图片；不把复杂排版自动转换成功当成保证。

新内容在 `site/content/post/目录名/index.md`，其他类型分别是 notes/discovery/project。图片放同一目录，正文写 `![图片说明](photo.jpg)`；封面写 `image: photo.jpg`。补好 description、topics 与真实日期；原有 content_id 永远保留，不随标题或目录改变。系列用相同 series，weight=10、20、30 决定顺序。

编辑期可用下面命令查看草稿（仅本机环回，Ctrl+C停止）：

```powershell
tools/hugo/hugo.exe server --source site --environment production --buildDrafts --bind 127.0.0.1 --baseURL http://localhost:1313/firlight/ --port 1313
```

需要正常动态预览可双击启动完整博客.cmd，但它默认不显示草稿。不要同时启动两个占用1313的入口。确认后在文件中改 draft=false，再执行：

```powershell
py -3 tools/blog.py verify-static
```

**draft=true 只是不生成公开网页，不会隐藏公开 Git 仓库里的源文件。私人日记、账号、未授权图片和敏感草稿请留在仓库外。** 已提交的内容进入历史，不要以为后来删除就等于从未公开。

## 从开发目录发布：先吸收手机改动，再复制

实际发布目录是桌面的 `github-pages-upload`，默认/发布分支为 `2026blog`。不是 self_website 内的旧上传快照。

```powershell
Set-Location C:/Users/Administrator/Desktop/github-pages-upload
git status --short --branch
# 工作区有修改时先处理它们，不要 reset/覆盖。
git pull --ff-only origin 2026blog
```

手机/网页可能刚更新了同一篇文章。先检查 `git log -5 --oneline` 与相应文件，把这些修改带回开发目录并合并，再继续写作。两处同文件有变更时用编辑器逐段比较，保留两边内容；不要整站镜像覆盖。新文章可以只复制这个新目录，下面路径必须换成你的真实目录名：

```powershell
Copy-Item -LiteralPath C:/Users/Administrator/Desktop/self_website/blog/site/content/post/today-observation -Destination ./site/content/post/today-observation -Recurse
py -3 tools/manage.py verify
git diff -- site/content/post/today-observation
git status --short
git add -- site/content/post/today-observation
git diff --cached --stat
git diff --cached
git commit -m "Add observation post"
git push origin 2026blog
```

此复制示例只用于目标目录还不存在的新文章；修改已有文章先合并，再复制明确文件。不要复制 .git、backend、数据库、密钥、备份、虚拟环境、工具程序、缓存或 public。资料改动只同步对应 hugo.toml/关于页/desk.json，不全盘覆盖配置。

Actions → Hugo Pages → build/deploy 都成功后，查看 https://zrkfirstlight.github.io/firlight/ 。如果推送被拒绝，先 fetch/比较远程新内容，合并后再推；不使用 force。失败时看 Actions 首个失败步骤；资源出错核对 baseURL 与 /firlight/ 前缀，不手写根域名资源地址。

新增或删除可评论内容后，本机运行 `py -3 tools/fullstack.py prepare`：它先备份，再同步稳定 ID。若手机发文后尚未同步，本机 API 会拒绝未知 ID，这是预期保护。当前公网站点仍关闭互动，不影响文章发布。

## 手机：短帖也还是一篇 Markdown

无需通过博客注册。用你自己的 GitHub 账号打开 [firlight 的 2026blog 分支](https://github.com/zrkfirstlight/firlight/tree/2026blog)，在 `site/content/post/` 选择 Add file → Create new file。文件名写 `2026-10-24-small-note/index.md`（日期/名称替换为实际值）。手机界面若没有该入口，可在浏览器请求桌面版网页。

复制仓库的 `templates/mobile-post.md` 内容，修改标题、当天日期、唯一 slug、永久 content_id 和摘要，写正文。确认可公开后设 draft=false，使用 Commit changes 提交到2026blog；它会触发现有构建。想先审核，选择新分支并开 Pull Request，在确认后合并到2026blog。不要把模板文件本身改成你的随笔。

纯文字最适合手机。图片先在对应文章目录通过 Add file → Upload files 上传，再引用文件名。多个步骤期间先保持 draft=true，图文齐全后再改 false。离线时在自己的笔记应用记录，恢复联网后再提交；未提交的浏览器编辑不是可靠备份。没有部署 Issues 自动转文章的机器人，不要把随意发一个 Issue 当作发文。

GitHub 官方支持[新建文件](https://docs.github.com/en/repositories/working-with-files/managing-files/creating-new-files)和[网页编辑](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files)；较多文件可以使用 [github.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor)。手机具体按钮可能随屏幕/版本变化，本次没有替你登录手机账号或验证移动端 GitHub 提交。

## 自己网站的写作后台：可行方案，暂不实施

若以后想在本站登录后写文，建议做一个**独立作者后台**，先只允许站主一个作者，不开放作者注册。评论用户和作者权限分开；普通用户不能通过前端伪造 author/admin 字段得到写权限。

后台写入私有草稿区，允许 Markdown 和受限图片；处理路径穿越、文件大小、扩展名与实际文件类型，不接受任意服务器路径或可执行附件。预览隔离脚本、转义内容，危险 HTML 不直接运行。只有显式“发布”操作才产生 Git 内容提交；禁止写工作流、依赖、配置和任意代码路径。发布过程保存审计记录、避免并发覆盖，失败不显示发布成功。

认证使用成熟机制和 HTTPS，可选择独立同站 Cookie 会话并校验 CSRF；限制作者登录、二次确认发布与关键配置，支持撤销会话。GitHub 凭据仅在服务端保存，限定到单个仓库的必要内容权限，不提供工作流或账号管理权限，不发给浏览器。不要直接复用当前读者 Token 加一个“发文”按钮。

这仍需要稳定 HTTPS 地址、本机在线、备份与更新责任，并要经过权限/CSRF/上传/并发测试。GitHub Pages 自身不能运行写入后端。当前不新增该攻击面、不保存发布密钥；网页写作先用 GitHub 官方账号和现成编辑器，尽量启用双重验证，公共设备用后退出。
