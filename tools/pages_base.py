"""Resolve one canonical build URL without logging in or changing Pages settings."""
import argparse,os,tomllib
from pathlib import Path
from urllib.parse import urlsplit
def resolve_base(config,pages_base):
    data=tomllib.loads(config.read_text(encoding='utf-8-sig')) if config.exists() else {}
    base=data.get('baseURL') or pages_base
    u=urlsplit(base or '')
    if u.scheme!='https' or not u.hostname or u.username or u.password or u.query or u.fragment:
        raise ValueError('正式 baseURL 必须是完整 HTTPS URL，不能带凭证、查询或片段。')
    return base.rstrip('/')+'/'
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--environment',default='production');p.add_argument('--pages-base',default=os.environ.get('PAGES_BASE',''));a=p.parse_args()
    if a.environment not in {'production','connected'}:p.error('只允许production或已接入的connected环境')
    base=resolve_base(Path(__file__).resolve().parents[1]/f'site/config/{a.environment}/hugo.toml',a.pages_base)
    print(base)
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'],'a',encoding='utf-8') as f:f.write('base_url='+base+'\n')
