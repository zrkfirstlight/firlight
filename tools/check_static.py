"""Check generated same-origin HTML references at root and repository base paths."""
import sys,json,re,xml.etree.ElementTree as ET
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
root=Path(sys.argv[1]); base=sys.argv[2]; parsed=urlsplit(base); prefix=parsed.path
release='--release' in sys.argv[3:]
errors=[]; seen=0
class Links(HTMLParser):
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if tag=='link' and data.get('rel')=='canonical' and not data.get('href','').startswith(base):
            errors.append('canonical 未使用当前正式 baseURL：'+data.get('href',''))
        for k,v in attrs:
            if k in ('href','src') and v and not v.startswith(('#','mailto:','tel:','data:','javascript:')):
                self.links.append(v)
for f in root.rglob('*.html'):
    p=Links(); p.links=[]; p.feed(f.read_text(encoding='utf-8'))
    page=urljoin(base,f.relative_to(root).as_posix())
    for v in p.links:
        u=urlsplit(urljoin(page,v))
        if u.netloc!=parsed.netloc: continue
        path=unquote(u.path)
        if not path.startswith(prefix): errors.append(f'{f.relative_to(root)}: 超出 baseURL 路径 {v}'); continue
        target=root/path[len(prefix):]
        if target.is_dir(): target=target/'index.html'
        if not target.exists(): errors.append(f'{f.relative_to(root)}: 缺失 {v}')
        seen+=1
required_pages=['index.html','post/index.html','categories/index.html','tags/index.html','archives/index.html','search/index.html','search/index.json','projects/index.html','about/index.html','404.html','index.xml','sitemap.xml','discussions.json']
required_pages+=['essays/index.html','learning/index.html','discoveries/index.html','topics/index.html','project/life-lab/index.html','notes/life-local-rules/index.html']
if release: required_pages+=['post/example-reading/index.html']
if not release: required_pages+=['guestbook/index.html','account/index.html']
for required in required_pages:
    if not (root/required).is_file(): errors.append('缺失页面 '+required)
for f in root.rglob('*'):
    if f.is_file() and (f.suffix.lower() in ['.sqlite','.sqlite3','.db','.py','.pyc','.key','.pem'] or f.name.startswith('.env') or f.name=='requirements.txt' or '.git' in f.relative_to(root).parts):
        errors.append('公开产物包含内部文件 '+str(f))
if release:
    try:
        rss=ET.parse(root/'index.xml').getroot()
        sitemap=ET.parse(root/'sitemap.xml').getroot()
        urls=[e.text for e in rss.findall('./channel/link')+rss.findall('./channel/item/link')+sitemap.findall('.//{*}loc')]
        assert urls and all(url and url.startswith(base) for url in urls)
    except (AssertionError,ET.ParseError,OSError): errors.append('RSS/站点地图 XML 或 baseURL 不正确')
    for forbidden in ['guestbook/index.html','account/index.html','js/community.js','js/community-api.js','CNAME']:
        if (root/forbidden).exists(): errors.append('静态发布不应包含 '+forbidden)
    for f in root.rglob('*'):
        if f.is_file() and f.suffix in ['.html','.json','.js','.css','.xml','.txt']:
            data=f.read_text(encoding='utf-8',errors='replace')
            bad=[r'https?://(?:localhost|127\.0\.0\.1)(?::8000)?/api',r'[A-Za-z]:[\\/](?:Users|Windows|Program Files)[\\/]',r'file://',r'data-api=',r'class="community(?:\s|\")']
            if any(re.search(pattern,data,re.I) for pattern in bad): errors.append('产物包含本机路径或动态接口标记 '+str(f.relative_to(root)))
            if f.suffix=='.html' and ('/guestbook/' in data or 'community-api.js' in data or 'community.js' in data or '<form class="auth-form"' in data):
                errors.append('静态页面仍包含不可用动态入口 '+str(f.relative_to(root)))
    try:
        assert json.loads((root/'discussions.json').read_text(encoding='utf-8'))['discussions']==[]
        search=json.loads((root/'search/index.json').read_text(encoding='utf-8'))
        assert isinstance(search,list) and search and 'guestbook' not in json.dumps(search,ensure_ascii=False)
        assert all(str(row.get('permalink','')).startswith(prefix) for row in search)
        if (root/'design-lab/index.html').exists():
            assert not any('/design-lab/' in (url or '') or '/design-preview/' in (url or '') for url in urls)
            assert not any('/design-lab/' in row['permalink'] or '/design-preview/' in row['permalink'] for row in search)
            for name in ['design-lab','design-preview']:
                page=(root/name/'index.html').read_text(encoding='utf-8')
                assert re.search(r'name=[\"\']?robots[\"\']?\s+content=[\"\']?noindex',page)
                assert 'experience.js' not in page and '/scss/style.' not in page
            for page in root.rglob('*.html'):
                if page.parent.name not in ['design-lab','design-preview']:
                    text=page.read_text(encoding='utf-8')
                    assert 'css/design-lab.css' not in text and 'css/design-preview.css' not in text
    except (AssertionError,KeyError,ValueError,OSError): errors.append('静态搜索/讨论清单不符合发布要求')
print(f'检查 {seen} 个站内引用，{len(errors)} 个问题')
for e in errors[:40]: print(e)
sys.exit(bool(errors))
