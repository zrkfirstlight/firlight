# 日常使用指南

本文件是日常操作的唯一入口（2026-10-26更新）。旧验收报告只代表当时结果，服务器迁移仍见 [SERVER_MIGRATION.md](SERVER_MIGRATION.md)。正式站为 https://zrk123.cn/，互动API为 https://api.zrk123.cn/api。

## 1. 打开工具与检查服务

开发目录：`C:\Users\Administrator\Desktop\self_website\blog`。发布仓库：`C:\Users\Administrator\Desktop\github-pages-upload`，对应 `zrkfirstlight/firlight` 的 `2026blog` 分支。不要使用 self_website 内旧的上传快照。

- 双击开发目录的 **本地内容管理.cmd**，打开 http://127.0.0.1:8765/ 。只接受本机访问，不能通过公网域名打开；窗口关闭即停止工具。
- 双击 **日常服务管理.cmd** 可启动、检查、停止本项目后端、检查公网、备份。不要重复安装 cloudflared。
- 后端已经配置为 **当前 Windows 用户登录后启动**，任务名 `Firlight-self-website-backend`，使用本项目 Pythonw、固定工作目录和私有 `.env`，不是无人登录时的开机服务。现有 cloudflared Windows 服务使用原有安全凭据。
- 每日19点的 `Firlight-self-website-daily-backup` 任务仅在此用户登录的会话内运行；关机或未登录不能保证备份。已实际触发试运行，结果应在任务计划程序中为0。错过后可手动备份。

在开发目录 PowerShell 可运行：

```powershell
.venv/Scripts/python.exe tools/daily.py start
.venv/Scripts/python.exe tools/daily.py status
.venv/Scripts/python.exe tools/daily.py public
.venv/Scripts/python.exe tools/daily.py backup
# 仅维护窗口需要停止，拒绝误停未登记的8000进程
.venv/Scripts/python.exe tools/daily.py stop
```

后端只监听 `127.0.0.1:8000`，管理工具只监听 `127.0.0.1:8765`。不要将隧道路由改到8765。

## 2. 填资料、写文章与插图

在管理界面选择“网站资料”：站名必填，当前使用中性的“个人博客”。可填写作者公开名称、简介、首页文字、“此刻”、页脚和关于页 Markdown。没有联系方式就留空；真实联系方式可写在关于页，不需要虚构社交链接。头像／标志、站点图标和默认分享图可以直接导入图片并选择用途，保存后生效。头像与标志共用主题原生位置。没有图片时不显示虚构头像。

选择“新建内容”，栏目有随笔、学习笔记、兴趣分享、项目。填写标题、英文短链接slug、摘要、分类和标签，设置日期、更新时间、封面与草稿，编辑 Markdown 后选择“保存到本地”。学习系列等原有额外字段会保留；本版界面不额外增加复杂专题管理。

- 文章源文件在 `site/content/post|notes|discovery|project/<目录>/index.md`。
- 新建时自动生成唯一 `content_id`。改标题和slug不改此ID；改slug会影响公开链接，已有显式url的文章保留原url。评论按ID归属。不要手动复制相同ID给另一篇。
- 保存后才能导入文章图片；文件自动获得唯一名字，写入同一文章目录，正文插入相对引用。请改图片说明，点击保存正文。封面填刚导入的文件名。
- 支持 PNG/JPEG/GIF/WebP，单张上限8MB；不接收可执行SVG或未知格式。图片不会覆盖同名文件。
- 草稿默认勾选。取消勾选只代表具备发布条件，**并不自动上传**。未来日期不会进入本次正式输出或公开源码同步。
- 点击“Hugo预览”，在下方看到当前主题的最终排版，包括本地草稿。编辑框未保存的文字不会参与构建。这里显示“预览构建完成”，不表示已上线。

工具继续直接维护 Markdown、`site/hugo.toml` 和 `site/data/desk.json`，没有另建内容数据库。升级环境时仅在项目虚拟环境运行 `.venv/Scripts/python.exe -m pip install -r tools/requirements-editor.txt`，不会修改全局Python。

## 3. 预览、审核与发布

1. 保存并预览；正式发布的文章取消草稿，检查日期和图片。
2. 点“准备发布／查看差异”。它构建 connected 正式版本、检查站内链接/图片/正式域名与公开边界，使用同一份正式讨论清单同步生产数据库，再把允许的源码变更整理到发布仓库。
3. **阅读文件清单和Git差异**。本地草稿、未来文章、后端、管理工具、数据库、备份、日志、`.env`、密钥、工具和生成HTML均不随此次内容同步。原有未审核的发布仓库人工修改如与开发源码冲突，会停止，不静默覆盖。
4. 填写提交说明，点击“确认提交并推送以上变更”，再次确认后才执行逐文件git add、commit、push。保存/预览不会触发push。不使用PAT，复用本机Git已有安全认证。
5. 出现“push成功”后点“检查Pages部署”，或查看 https://github.com/zrkfirstlight/firlight/actions 。**只有对应提交工作流success并且正式网页显示更新，才算上线**。失败时源文稿和本地提交保留，不要重置或重复新建文章。
6. 打开 https://zrk123.cn/ 强制刷新，核对文章、图片、搜索及评论区。新文章的评论登记来自正式构建，不包括草稿。

内容同步若失败，会明确警告，允许需要的纯静态发布。恢复后在开发目录执行：

```powershell
.venv/Scripts/python.exe tools/blog.py sync-content --base-url https://zrk123.cn/
```

该命令读取生产 `backend/.env` 中的数据目录；请不要在设有临时 `BLOG_DATA_DIR` 的测试终端执行。日常管理发布入口会清除临时覆盖变量，使用正式配置。删除/归档文章后，旧讨论停用但评论数据保留；恢复同一ID并重新同步可以重新关联。

如果push因认证失败，需要你在本机Git正常完成授权；工具不会保存或显示访问令牌。如果网络失败但已有提交，在发布仓库重试 `git push origin 2026blog` 即可，不要强推。

## 4. 登录与评论审核

在正式站“账号”或文章评论区，用你自己的现有管理员账号登录，不需要重新创建。注册保持关闭，已有账号可正常登录。普通读者无需登录阅读公开内容；评论、回复和留言需要账号，提交后审核。

登录Token在**当前标签页sessionStorage**内保存，刷新和同源整页导航后通过API验证恢复，服务端仍最多八小时有效。退出、明确401失效或到期会清除；网络失败不会自动退出。同一账号新登录会撤销旧Token。新标签页不保证自动登录；浏览器恢复会话、复制或由opener打开的标签页可能保留/复制会话，不能将“关窗口”视为可靠注销。共用设备用完请主动退出。密码和评论草稿不写入浏览器存储，不提供永久记住我。

管理员使用“审核评论”可通过、隐藏、删除；“管理用户”可启用/停用普通账号。网页账号管理不是后台内容编辑器，文章在本机工具管理。忘记密码仍需本机交互重置，管理员密码由你自己输入。

确认管理员与公网互动验收后，如确实希望开放注册，编辑私有 `backend/.env` 的 `REGISTRATION_OPEN=true`，再执行 `tools/daily.py restart`。没有邮件验证或自助找回密码；不要无意开放注册。

## 5. 备份与误改恢复

- 数据：双击“备份数据.cmd”，或执行 daily.py backup。使用 SQLite 在线一致性备份，包含完整动态数据库、后端版本和必要私有配置，带SHA256；**私有包可能包含密钥，绝不能上传Git或公开分享**。
- 自动与手动daily备份都位于 `backups/daily`，仅保留此目录最新14包及校验文件；其他迁移备份不自动清理。请另存一份到你自己的安全位置。
- 后端日志 `logs/backend.log`，2MB轮转，5份历史；备份任务日志 `logs/backup.log`，1MB轮转，3份历史。bootstrap保留有限历史。日志不记录请求体、密码或Token。
- 编辑覆盖前会把原文件备份到 `backups/content-editor/<时间>/site/...`，可复制回对应路径后预览。备份不会自动进入发布仓库。
- 工具“归档”将文章及图片移到 `content-archive/editor-<时间>/...`，在“查看归档”可恢复；原路径已存在时拒绝覆盖。两篇排版示例和原项目/关于占位文稿在 `content-archive/20261026`，保留恢复能力，不参与公开构建和Git提交。
- 已公开版本也可在发布仓库Git历史中比较并恢复单个文件；不要 `reset --hard` 或强推覆盖其他改动。
- 完整服务器迁移、独立目录恢复、会话撤销和回滚步骤见 [服务器与数据库迁移指南](SERVER_MIGRATION.md)。当前产品没有用户上传API；内容图片随Markdown源码，保留的后端uploads目录不能虚称已提供上传功能。

## 6. 连接故障判断与恢复

静态站始终由GitHub Pages提供，电脑关机、睡眠或互动API故障不会使已发布文章、搜索和浏览器实验依赖本机服务器。离线时交流区显示“互动服务当前不可用，请稍后再试”，提交禁用，当前页面输入保留。不要刷新未发送的长留言，先复制到私人笔记。

先运行daily.py status：后端health与隧道ready分开报告。后端不正常先start；已登记后端故障可restart。隧道service Running并不等于有连接。已授权的HTTP/2配置保存在现有服务Environment，四条TCP7844连接和ready指标用于核对实际传输。回滚记录在私有 `artifacts/runtime/cloudflared-protocol-before.json`；需要恢复时管理员PowerShell运行 `scripts/cloudflared-protocol.ps1 -Mode Rollback`，不是重建隧道。

公网health用daily.py public检查。1033表示没有可用连接器；502需同时看源站与隧道，不能一概说电脑关机；401是登录状态，403是权限/来源等业务错误，429需等待；DNS、TLS、请求超时分别排查。不要关闭防火墙、证书验证或随意改系统代理。

服务恢复后在原页点“检查／重试”，再确认是否需要提交，避免重复留言。短时测试成功不代表长期稳定。机器睡眠、重启及网络变化仍会影响API。最终需要你自己在合适时间重启/重新登录Windows一次，确认登录任务启动、cloudflared连接和公网health；本轮没有擅自重启或注销。

## 7. 尚未提供的个人资料

正式站名（目前为个人博客）、作者公开名称、个人简介、头像/标志、站点图标、分享图和真实联系方式均可选填；没有推断你的姓名或经历。音乐已有三个指定曲名但没有音源，仍准确显示“音源待配置”。只有你提供或明确授权的音频可配置在 `site/data/experience.json`，本地文件放 `site/static/audio/`；不以别的歌曲代替。主题署名及素材许可保留。

本地管理新增依赖仅 PyYAML 6.0.3（MIT）与 tomlkit 0.13.3（MIT），不加载到公开页面。没有新增第三方图片或音频。
