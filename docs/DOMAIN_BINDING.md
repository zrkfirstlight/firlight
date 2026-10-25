# zrk123.cn 静态域名修复

2026-10-25。本次仅发布静态根域修复并核对Pages设置；不启用API、隧道或connected环境。

## 原因与修复

修复前https://zrk123.cn/的HTML返回200，但仍引用/firlight/css与/firlight/js，7项CSS/JS返回404；根路径/css/desk.css等资源存在。搜索和canonical仍带旧项目地址。DNS解析不是这次缺少样式的原因。

site/config/production/hugo.toml已明确baseURL=https://zrk123.cn/；tools/pages_base.py优先此值，仅在没有明确域名时回退到Pages元数据。Actions固定production，构建和静态检查共用解析结果。源码与主题仍由Actions构建，不维护第二套生成HTML。

## 已核对的后台与DNS

GitHub仓库zrkfirstlight/firlight，默认/发布分支2026blog。Pages来源workflow，自定义域名zrk123.cn，HTTPS强制访问已开启；使用现有配置，不需要为本次修复改DNS或后台域名。

公开NS为dns21.hichina.com、dns22.hichina.com。主域已有GitHub Pages四条A记录：185.199.108.153、185.199.109.153、185.199.110.153、185.199.111.153；www CNAME指zrkfirstlight.github.io（不含/firlight）。www和旧github.io项目网址跳转主域，主域始终由Pages服务。

这是自定义Actions发布，CNAME文件不能替代Pages后台域名设置，本次不新增它。若将来改分支发布，再按官方要求处理发布源CNAME。参考[GitHub官方域名说明](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。

## 后续更新与排查

正常更新文章后，在发布仓库检查差异、提交并push origin 2026blog，由Hugo Pages构建/部署。检查build和deploy均成功；访问https://zrk123.cn/及www，CSS/JS应为域名根路径且200，搜索、canonical、RSS和sitemap不再带旧/firlight前缀。

本地检查可执行`py -3 tools/manage.py build --base-url https://zrk123.cn/`。要回到默认GitHub项目地址，需同时明确调整Pages后台域名与production的baseURL，不能只改其中一处。

互动仍为关闭状态；api.zrk123.cn未接入。不向主域添加本机A记录，不用DNS轮询模拟故障切换，不改现有邮箱和验证记录。
