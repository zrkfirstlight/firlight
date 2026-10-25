# 服务器与数据库迁移指南

日期：2026-10-25。保持Django 5.2.18、DRF 3.16.1、SQLite、Waitress 3.0.2；完整锁定依赖在backend/requirements.txt，Python要求3.12+。本轮在Windows实际演练，Linux命令仅作准备，未宣称云机/跨系统验收成功。

## 什么要搬，什么能公开

| 内容 | 处理 |
| --- | --- |
| backend源码、requirements、tools/server.py、tools/migrate_service.py、示例配置 | 可在你自己的受控源码仓库版本管理；当前公开前端仓库不需要上传它们 |
| Markdown、文章图片、主题及前端配置 | 仍在静态源码Git中，由Actions构建，不把数据库当CMS |
| data/blog.sqlite3 | 完整用户、密码哈希、令牌、讨论登记、评论/回复/留言、Django结构版本；始终私有 |
| data/uploads/及其他data持久化文件 | 原样校验迁移；当前无用户上传API，真实目录没有上传文件，不虚构上传功能 |
| data/secret.key、backend/.env、进程环境秘密 | 单独安全转移；可明确选择包内带文件秘密，包本身不加密 |
| cloudflared Token、凭据JSON、系统任务、PATH、虚拟环境 | 不随源码搬；在新机器由你安全配置，虚拟环境重新建 |

MEDIA_ROOT已明确为data/uploads，仅供持久化边界，未新增上传或公开文件服务。工具备份data中的持久化文件，排除生成static、缓存和日志；不要把自定义持久文件放在未指定的数据根目录之外后又以为自动包含。

## 工具与包结构

`tools/migrate_service.py`只依赖Python标准库，backup/inspect/restore三个命令。包包含app/backend的源码、准确依赖锁、便携server.py/迁移工具、data数据库和附件，以及manifest.json：格式版本、UTC时间、打包Python/SQLite/平台、已安装依赖版本、实际迁移记录、表计数、安全配置快照、逐文件SHA256与大小；旁边另有整个包的.sha256。

SQLite使用Connection.backup在线一致性备份，不直接复制正在写入的主文件，也不遗漏WAL。整库保留所有表，并验证integrity_check/foreign_key_check。附件不是事务数据库；最终迁移**必须停止所有写入**后再打最终包，避免数据库快照与附件跨时刻不一致。

包名必须以`.blog-backup.zip`结尾，忽略规则和Git审计能识别它。包、恢复目录、凭据只能放私有位置，推荐已忽略的migration-private/；公开产物检查拒绝数据库/密钥等内部文件。

## 旧机器：暂停、最终备份、转移

先停隧道流量/写入入口，再停止后端及其他会改SQLite或附件的任务。记录最后写入时间和账号/评论数，不同时保留两台可写实例。以下在完整开发blog目录执行，日期名示例若已存在请换新名字：

```powershell
.venv/Scripts/python.exe tools/migrate_service.py backup --data-dir backend/data --output migration-private/final-20261025.blog-backup.zip
.venv/Scripts/python.exe tools/migrate_service.py inspect --bundle migration-private/final-20261025.blog-backup.zip
Get-FileHash migration-private/final-20261025.blog-backup.zip -Algorithm SHA256
```

实际数据目录若由BLOG_DATA_DIR指定，要将--data-dir替换成那个目录。默认不包含secret.key或backend/.env；通过加`--include-secrets`可将它们放入私有包。无论是否加这个开关，数据库本身都含敏感用户数据，包不是可公开内容。环境变量中的SECRET_KEY和隧道凭据不会被自动导出，需要你单独安全转移；manifest会提示是否存在外部SECRET_KEY配置。

用加密磁盘、受控SFTP等传输包和必要秘密，并独立比对发送方SHA256。校验用于发现损坏，**不能证明不可信包来源可靠**。包中源码恢复后不会自动执行；未知来源不要启动。

## 新机器：新目录恢复与验证

先准备Python 3.12（尽量与manifest一致）及私有工作目录，复制受信任的迁移脚本/包。默认恢复必须是**不存在的新目录**，已有目录即拒绝，不提供静默覆盖或自动删除。需要更换正式数据时先备份，再通过配置切换新目录，不原地覆盖旧库。

```powershell
py -3.12 tools/migrate_service.py restore --bundle migration-private/final-20261025.blog-backup.zip --target migration-private/new-instance
Set-Location migration-private/new-instance/app
py -3.12 -m venv .venv
.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
$env:BLOG_DATA_DIR = (Resolve-Path ../data).Path
.venv/Scripts/python.exe tools/server.py check
.venv/Scripts/python.exe tools/server.py migrate
```

迁移包把data恢复为app的同级目录；必须指定正确BLOG_DATA_DIR，不能意外创建一个新的空库。private/backend.env（如有）只作待审核备份，**不自动激活**：其旧路径、密钥来源、主机白名单须重新核对。按public.env.example配置实际Host/CORS、关闭注册和DEBUG。需要保留密钥时使用恢复的secret.key；默认未携带时，Django会在新data中安全生成新密钥。不要把示例或旧机器绝对路径照搬。

恢复器先对比manifest全部文件哈希/大小、库计数、迁移记录与外键，再清除所有DRF Token及Django会话。用户/密码哈希/评论不删，原密码可以重新登录；即使保留旧密钥，也统一要求重新登录，避免迁移前令牌继续有效。恢复报告位于new-instance/restore-report.json。

```powershell
.venv/Scripts/python.exe tools/server.py serve
# 另一个同配置窗口：
.venv/Scripts/python.exe tools/server.py health --host-header api.zrk123.cn
```

先在本机环回验证真实账号登录、本人内容、回复父子关系、留言、审核与权限、附件哈希/可读性，再经临时受控测试入口核验实际HTTPS和精确CORS；不要让公网写入先于验收。当前没有上传接口，所以验证的是持久文件，未来若增加上传还需验证其业务引用与访问权限。

Linux准备示例（未实际跨系统验收）：

```bash
cd new-instance/app
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
export BLOG_DATA_DIR="$(cd ../data && pwd)"
.venv/bin/python tools/server.py check
.venv/bin/python tools/server.py migrate
.venv/bin/python tools/server.py serve
```

便携server.py不依赖Hugo、Node、Windows路径；Waitress只监听127.0.0.1:8000。Linux文件权限应仅给服务账号，密钥/环境文件设置私有访问。系统服务/反向代理由你配置，不复制Windows虚拟环境，也不擅自写入systemd/任务计划。

## 切换与回滚

保持旧实例停止写入，在新实例验收通过后，由你把命名隧道连接器/入口目标切到新机。若换HTTPS服务商，再修改api域名解析/证书，主域名/www仍指Pages。保持api.zrk123.cn不变时，前端无需改API地址或重新构建。不要把两个连接器同时路由到两个独立可写SQLite库。

新实例尚未接收任何新数据时，可以停止新实例、切回旧实例及其匹配配置。**新实例已经产生新数据后，不能直接切回旧库**：先停新写入、对新实例再做最终备份并恢复到旧机器的新目录，验证后再切；或者人工审查合并，不能丢弃新增账号/评论。代码回退也要与数据库结构相匹配，不盲目运行反向迁移。

目前community结构版本仍为0002_discussion_registry，本轮没有业务表变更。以后升级前也先打包、在独立副本migrate与检查；保留旧包直到迁移验收与回滚窗口结束。

新机器若仅部署恢复包里的后端，不需要安装Hugo。以后新增文章的登记清单从受信任的静态源码构建后安全传过去，运行`.venv/Scripts/python.exe backend/manage.py syncdiscussions 受信任清单.json`（Linux使用.venv/bin/python）；保持正确BLOG_DATA_DIR。不要接收访客提交的清单或让后端解析主题HTML。文章URL可改变，已有content_id不变，历史评论不会因此换归属。

## 本轮真实演练

独立库中创建2用户、3评论（含1回复和1留言）、1个明确标记的演练附件；保持源连接WAL模式并提交昵称后打包。新目录恢复后校验关系与附件，通过恢复代码启动API、原密码登录、精确主域/www Origin、权限拒绝及退出撤销均通过。另验证带秘密选项、拒绝覆盖、危险路径和损坏包。未覆盖正式数据库；未宣称真实上传、Linux迁移或公网HTTPS已通过。完整报告见DOMAIN_MIGRATION_STATUS.md。

## 2026-10-25 公网接入准备复核

最新状态以 [接入验收结果](API_ACCESS_RESULT.md) 为准。真实生产库的独立备份恢复也已执行，另有非空隔离数据集核对用户、回复关系、approved/pending 状态与稳定内容 ID。当前没有上传 API；演练持久文件为合成工具夹具。

备份 manifest 现在同时记录 BLOG_PROXY_MODE，源码包附带 check_access.py。迁移后若仍通过同机 Cloudflare Tunnel，严格保留 127.0.0.1 绑定与显式 cloudflare-tunnel 模式；如果入口改变，先改为 direct 并重新设计代理信任，不能任意相信 XFF。恢复到新目录后须人工核对 BLOG_DATA_DIR 与实际生产库，原 .env 不自动激活。
