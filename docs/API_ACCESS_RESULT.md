# 本机接入验收结果（2026-10-25）

本次完成本地接入准备和整改；18:37 的真实公网只读及 **15 项 HTTPS 读写验收通过**，工作流据此切换 connected，按站主新增授权审核后提交/push。曾观察到现有连接器断连，不能承诺长期稳定；前端保留离线降级。未登录账号控制台、未修改 DNS/NS/隧道或系统服务。提交和部署状态以最终交接为准。

## 实际通过

- 私有配置先备份再合并。密钥、数据库路径和账号数据未覆盖。生产精确 Host 为 api.zrk123.cn，CORS 仅 https://zrk123.cn 与 https://www.zrk123.cn，默认关闭注册，DEBUG=false。
- 127.0.0.1:8000 唯一监听（netstat 实查），现有用户安装的 cloudflared 服务未改动。已安装 cloudflared 2026.10.3，Cloudflare 有效签名。
- 公开 DNS 解析器确认 Cloudflare 的 gerardo/keyla 两条 NS；API 解析正常。真实公网 HTTPS health 返回 200/token/28800 秒；正确 Origin 的 Authorization 预检通过，错误及本地测试来源无 ACAO，未登录 /me/ 返回 401，admin/API Cookie 登录路径 404，静态站 200。这是一次完整只读通过记录，**不是持续可用性保证**。
- 17 项 Django 测试：密码校验/哈希、八小时服务端过期、退出撤销、停用立即失权、Cookie 不授权、关闭注册仍可登录、作者与管理员权限、精确 CORS、可信代理地址和伪造代理头、登录/提交限流、已登录请求不能绕过登录限流、稳定内容标识与删除策略。
- 独立 Waitress 实例的 21 项真实 HTTP 检查：跨域、注册/登录/退出、评论/回复/留言、审核、权限、昵称、进程重启保留数据、在线备份恢复。测试端口由系统分配，不会误连已运行的 8000/8008 服务。
- SQLite WAL 一致性备份与独立恢复：2 个用户、3 条评论/回复/留言、审核状态、稳定内容 ID、恢复后登录、会话撤销、损坏包/越界路径/覆盖拒绝。另将实际生产库完整备份并恢复到新目录，核对完整性、用户计数、12 个讨论及密钥一致，未覆盖原库。
- 无上传接口；合成持久文件仅测试备份工具能保留文件，不冒充真实上传业务测试。
- 同一 backend/.env 下执行 sync-content，实际目标为 backend/data/blog.sqlite3，登记 12 个讨论；生产 server.py 使用相同设置。真实库当前无账号、无评论；临时公网验收账号已清理，没有创建默认管理员。
- 前端 API 客户端行为测试通过：6 秒超时、业务 401/403/429 与离线/5xx 区分、credentials=omit、Token 显式发送、取消请求与销毁。
- 浏览器本地真实跨域预览：动态数据可读；停止独立测试后端后手动重试提示暂不可用、禁止提交、草稿保留；恢复同一测试后端后同页重试恢复，无需重新构建。390 像素窄屏 scrollWidth=375，无横向溢出。测试未放宽生产 CORS，未停止用户隧道。
- 正式静态 production 根域构建 2473 个引用零问题；connected 根域和 /firlight/ 子路径各 2722 个引用零问题；搜索索引、图片、脚本、RSS、sitemap、404 与公开文件边界检查通过。主题外观保留。

## 修复

1. 隧道后匿名访客共用环回地址的限流问题：显式代理模式 + 可信环回 peer + 合法单个 CF-Connecting-IP；忽略任意 XFF。边界见接入指南，不宣称能抵挡同机恶意程序。
2. 已认证客户端带 Token 请求登录可绕过 AnonRateThrottle：登录/注册改为始终按来源地址限流，不改变业务接口。
3. connected 环境下 Stack 非 production 分支产生含 Windows 源码路径的 JS：仅覆盖 footer/components/script.html 的压缩条件，不改主题子模块；正式产物检查现在覆盖 connected。
4. 旧文档的“API 未解析、cloudflared 未安装、NS 仍在阿里云”、不存在的工作流切换方式已纠正；只用远程管理路线，YAML 标记另一可选方案。
5. 验收工具固定端口误连已有测试服务：改为系统分配端口。私有生产配置启用后，阻止 fullstack start 把生产库同步成 localhost 预览 URL。

## 曾发生故障与仍未验证

- 连接器 readyConnections 实测出现 4→0→4→0，公网出现 502 / 530（1033）；进程和 Windows 服务 Running 不代表隧道已连接。没有擅自读取凭据、重装/重启服务或修改 Published application。
- 公网写入验收首次登录请求遭 502，中断并清理账号；18:37 隧道恢复，重测 15 项全部通过：三个角色 HTTPS 登录、注册关闭仍可登录、评论待审、他人编辑拒绝、普通用户管理拒绝、管理员审核、公开读取、回复、留言、昵称、退出撤销、八小时过期及停用失权。验收账号和评论全部清理，没有改为默认密码或永久测试账号。
- 公开域名的浏览器页面读取/截图工具反复超时，未完成真实公开网页的浏览器登录操作；当前 API 认证/写入是实网 HTTPS 测试，不冒充浏览器登录。生产注册保持关闭；站主管理员需自己输入密码创建。
- 没有人为停止现有隧道来测试边缘离线；已观察到真实断连，并在独立测试后端验证前端降级。长时间稳定性、睡眠后恢复、其他地区网络、Linux 迁移未验收。
- Hugo 的旧 libsass 弃用警告仍存在，当前固定 0.168.0 构建成功；主题升级时另行处理。

## 站主现在只需做的事

| 在哪里操作 | 填写什么 / 执行什么 | 成功标志 |
| --- | --- | --- |
| 自己的 Cloudflare 隧道控制台 | 核对现有隧道 Healthy、Published application 为 api.zrk123.cn → http://127.0.0.1:8000，Host 不改为 localhost；无需再创建隧道 | Healthy 持续稳定，API health 连续人工检查为 200 |
| 本机私下 PowerShell | 依 LOCAL_API_ACCESS.md 尝试已有隧道的 HTTP/2 前台连接；Token 自己输入，不发给助手。现有服务不重复安装 | 注册连接成功，readyConnections 持续大于 0，不再 1033 |
| 完整开发目录 blog 的 PowerShell | `.venv/Scripts/python.exe backend/manage.py initadmin`，交互输入自己的用户名/密码 | 提示管理员已创建；无默认密码 |
| 修复后同目录 | `.venv/Scripts/python.exe tools/check_access.py public` | 全部通过 |

真实公网临时账号读写现已通过。助手继续正式构建/安全审计、提交/push，最后从公开域名浏览器验收。若要向访客开放注册，先确认管理员，再将私有 REGISTRATION_OPEN 改 true 并重启后端；无需重建静态站。不能以临时关闭证书检查、放宽 CORS 或开放入站端口代替修复。

完整命令与错误分层见 [本机后端公网接入指南](LOCAL_API_ACCESS.md)。仅私有 artifacts/api-preflight 保存逐项 JSON / 日志及完整备份；不提交这些文件。截图在 docs/screenshots/api-offline-recovery.jpg、api-mobile.jpg。

## 已发布结果

首个互动提交 `25a1e011137af24ff02cb827a01435ec9c983b17` 已正常 push 到关联仓库 2026blog。GitHub Actions [40185726648](https://github.com/zrkfirstlight/firlight/actions/runs/40185726648) completed/success，包含构建与部署。正式首页、文章、/account/、/guestbook/、搜索索引（11 条）及两份社区脚本实网 HTTP 均为 200；三种互动页面实际含正确 HTTPS API 配置。没有用本地构建结果代替公网结果。

本轮还更新了访客互动说明，随 production/connected 自动显示准确状态。首次管理员仍由站主自行输入密码创建；公开注册关闭，因此当前没有永久账号可直接登录。已有测试账号全部删除。若当前 health 正常，无需重复 DNS 或重建隧道；仅在再次出现 1033 时按接入指南私下排查连接器。
