# 个人博客项目

正式站：https://zrk123.cn/ 。Hugo Extended 0.168.0 + Stack 4.0.3 提供静态阅读；Django 5.2.18 / DRF 3.16.1 / Waitress 3.0.2 + SQLite 提供独立账号、评论与留言API。

**日常操作只看 [日常使用指南](docs/DAILY_USE.md)**：启动、资料与文章编辑、图片、预览、审核发布、评论管理、备份和故障恢复均集中于此。双击开发目录的 `本地内容管理.cmd` 打开仅本机的管理界面；保存不会直接发布。

开发在 `self_website/blog`；实际推送仓库是桌面的 `github-pages-upload`，关联 `zrkfirstlight/firlight` 的 `2026blog` 分支。发布仓库保存Hugo源码与固定主题快照，Actions构建网页，不手动维护生成HTML。后端、数据库、密钥、管理工具运行状态与私有备份留在本机。

- site/content：Markdown与文章图片；site/hugo.toml、site/data：公开资料及配置。
- site/layouts、site/static、site/assets：保留主题的局部扩展；site/themes/stack：固定主题。
- backend：动态服务源码；backend/.env、backend/data：私有配置、数据库和密钥。
- tools、scripts：本地内容管理、发布审核、运行、备份与验收入口。
- artifacts、backups、content-archive：私有验证产物、备份与归档，不进入公开构建或提交。
- .github/workflows/pages.yml：现有connected发布工作流，主地址为真实域名根路径。

[本轮验收报告](docs/DAILY_READINESS_REPORT.md) 区分本地、浏览器、公网与部署结果。[迁移指南](docs/SERVER_MIGRATION.md) 保留完整迁移细节。其他早期说明只作技术历史参考，不替代日常指南。

注册保持关闭；现有管理员继续使用，未创建默认密码。登录按标签页保持、最多八小时，退出可撤销；互动故障不影响静态阅读。本地管理8765不能通过Cloudflare公开。
