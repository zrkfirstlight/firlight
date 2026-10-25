# zrk123.cn 域名绑定指南

核查日期：2026-10-25。没有登录账号、修改DNS/Pages设置或执行push。

## 先解决当前无样式

公开HTTP实测：`https://zrk123.cn/`返回200，`www`和旧的`zrkfirstlight.github.io/firlight/`跳转到它，HTTPS可用。但HTML引用`/firlight/css/desk.css`等7个CSS/JS地址，全部404；同一资源`/css/desk.css`、`/css/sky.css`实际200。搜索索引还输出`/firlight/...`，canonical仍指旧域名。这说明DNS已让访客到达Pages，**线上仍是旧baseURL生成的产物**。继续增加A记录无法修复。

本地已修复：`site/config/production/hugo.toml`为`baseURL = "https://zrk123.cn/"`；`tools/pages_base.py`优先此值，缺省才使用Pages元数据。Actions的构建和验收共用它的输出，不再直接让旧项目路径覆盖正式值。`connected`也使用同一正式域名，但当前工作流保持production，互动关闭。

你完成下文提交/推送、等新Actions构建部署成功后，公网页面才会替换旧HTML。本轮不替你推送，不能声称线上无样式已消失。不要手动编辑生成HTML或复制一套/firlight目录来掩盖问题。

## DNS实际归属与应保留的记录

本机Resolve-DnsName读取公开记录：NS为`dns21.hichina.com`、`dns22.hichina.com`，确认当前是阿里云HiChina权威DNS，并非只依据购买渠道推断。阿里云也说明hichina.com后缀属于其DNS服务：[官方说明](https://help.aliyun.com/en/document_detail/3043824.html)。

| 主机 | 类型 | 实测/目标 |
| --- | --- | --- |
| @ | A | 185.199.108.153、185.199.109.153、185.199.110.153、185.199.111.153；当前已齐全 |
| www | CNAME | zrkfirstlight.github.io；当前已存在，不带协议、不带/firlight |
| @ | AAAA | 当前未见；不是静态上线必需，若使用只填GitHub官方地址 |
| api | 暂不创建 | 本次查询无A/CNAME，正式入口尚未配置，不能指向随意公网IP |

保留已有MX、TXT、邮箱验证、SPF/DKIM/DMARC和域名验证记录。不要把根域指向本机，不混合本机与GitHub的A记录，不用DNS轮询当故障切换。不新增通配符记录。

## 你在GitHub手工核对

1. 打开`zrkfirstlight/firlight` → Settings → Pages，Build and deployment来源应为GitHub Actions。
2. Custom domain应为`zrk123.cn`。从公开跳转看绑定已经生效，但本轮未进入后台检查。不要把api或www设成主站域名。
3. 检查DNS检测结果和证书状态，Enforce HTTPS启用后访问主域名与www。建议按GitHub提示验证域名所有权，其TXT值由你的账号生成，不在此编造。
4. 当前是自定义Actions发布，不生成CNAME来替代后台域名设置。若将来改为分支发布，才按Pages要求在发布源放正确CNAME；不能只留在未发布的源码目录。

官方依据：[GitHub自定义域名配置与Actions/CNAME区别](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。www对应根域的跳转由Pages处理，不依赖本机后端。

## 你在阿里云手工核对

在云解析DNS找到zrk123.cn，确认它仍使用上述NS与记录；目前根域/www已正确，不为修复样式重复修改。需要额外域名验证时仅添加GitHub给出的明确TXT。api等正式入口方案定下来再做，见LOCAL_API_ACCESS.md。没有提供可直接套用的假隧道UUID或凭据。

## 发布本地修复（PowerShell）

实际发布仓库`C:/Users/Administrator/Desktop/github-pages-upload`已同步本轮公开源码，保留原历史，**未提交、未push**。先查看本次差异；若远程已由你更新，先fetch/比较并合并，不能用旧副本覆盖它：

```powershell
Set-Location C:/Users/Administrator/Desktop/github-pages-upload
git status --short --branch
git diff
py -3 tools/manage.py build --base-url https://zrk123.cn/
git add -- .github/workflows/pages.yml .gitignore site tools/pages_base.py tools/check_static.py tools/audit_git.py docs/DOMAIN_ZRK123.md docs/LOCAL_API_ACCESS.md docs/SERVER_MIGRATION.md docs/DOMAIN_MIGRATION_STATUS.md README.md
git diff --cached --stat
git diff --cached
git commit -m "Fix custom domain base URL and prepare API profile"
git push origin 2026blog
```

这些Git命令由你执行。本轮没有写入GitHub账号、没有新建仓库或更改远程设置。后端迁移脚本/私有数据不属于此公开仓库的上传范围。

在Actions查看Hugo Pages的build/deploy均成功，刷新`https://zrk123.cn/`；开发者工具Network中CSS/JS应为根路径且200，搜索结果、文章链接无旧/firlight前缀，canonical/RSS/sitemap均为https://zrk123.cn/。再测试www与手机。必要时强制刷新缓存，但清缓存不能代替重新部署。

本地双击预览发布版本.cmd仍是**子路径兼容检查**；根路径检查可用`py -3 -m http.server 1314 --bind 127.0.0.1 --directory site/public`后打开http://localhost:1314/（先按上面命令构建）。不要同时运行同端口服务。正式构建不会请求API。
