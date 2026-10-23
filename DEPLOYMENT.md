# GitHub Pages 发布说明

日期：2026-10-23。

实际仓库为 zrkfirstlight/firlight，分支2026blog；目标网址为 https://zrkfirstlight.github.io/firlight/。本机正式发布仓库目录为 github-pages-upload，完整功能的主体开发仍在 self_website/blog 中进行。

## 配置

1. `.github/workflows/pages.yml`监听2026blog推送，并保留手动运行入口。
2. Pages发布来源应选择GitHub Actions（API build_type=workflow），不能使用直接从分支根目录发布源码的legacy模式。
3. configure-pages提供真实baseURL，Hugo命令显式使用production；构建校验后仅上传site/public。
4. Hugo/主题/Action固定版本及最小分离权限保留；无个人访问令牌写入工作流、无自定义CNAME。
5. 登录/注册/评论/留言提交当前关闭；无需保持本机后端在线。音乐没有实际音源时显示待配置。

## 验收

Actions中本次提交对应的Hugo Pages工作流需build/deploy均成功。使用部署环境链接访问网站；检查首页、文章、图片、搜索和/firlight/下的资源。未结束的工作流或仅本地构建成功，不能视为公网部署成功。

本次修改修复了原工作流监听main、实际仓库为2026blog的不一致，并将Pages来源从legacy切换为Actions。完整执行结果与实际公网检查由发布交接报告记录，不把这一配置说明当作成功部署凭证。

## 常见失败

- 没有运行：确认推送2026blog，检查Actions是否启用。
- configure-pages失败：确认Settings → Pages → Source为GitHub Actions。
- 构建失败：看具体失败步骤，不提交生成public目录代替修复源码。
- 发布被阻止：检查github-pages环境的部署分支限制或待审批状态；不要关闭仓库保护来规避。
- 资源404：检查日志中的Pages baseURL是否包含/firlight/，不要改成机器路径或硬编码localhost。
- 变更需回退：对具体提交使用git revert，保留历史，不使用强制push覆盖远程。
