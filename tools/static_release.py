"""Static-only release build/check/preview. Standard library; no Django or Node dependency."""
import argparse,subprocess,os,sys,tempfile,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HUGO=ROOT/'tools/hugo/hugo.exe'
def run(args,**kwargs): subprocess.run([str(x) for x in args],check=True,cwd=ROOT,**kwargs)
def build(source,out,base):
    env={k:v for k,v in os.environ.items() if k not in ['HUGO_PARAMS_APIBASE','HUGO_PARAMS_COMMENTS_ENABLED']}
    run([HUGO,'--source',source,'--themesDir',ROOT/'site/themes','--environment','production','--destination',out,'--baseURL',base,'--cleanDestinationDir','--minify'],env=env)
    run([sys.executable,ROOT/'tools/check_static.py',out,base,'--release'])
def verify():
    if (ROOT/'.git').exists(): run([sys.executable,ROOT/'tools/audit_git.py'])
    else: print('尚未初始化 Git：跳过索引/历史审计；构建与链接验证照常进行。')
    build(ROOT/'site',ROOT/'artifacts/pages-root','https://example.test/')
    build(ROOT/'site',ROOT/'site/public','https://example.test/project/')
    # A clone of the source only; synthetic posts never enter real content or Git.
    with tempfile.TemporaryDirectory(prefix='pages-growth-') as tmp:
        source=Path(tmp)/'site'
        shutil.copytree(ROOT/'site',source,ignore=shutil.ignore_patterns('themes','public','resources','.hugo_build.lock'))
        for n in range(7):
            post=source/f'content/post/pages-fixture-{n}/index.md'; post.parent.mkdir(parents=True)
            post.write_text(f'---\ntitle: Pagination QA fixture\nslug: pages-fixture-{n}\ncontent_id: pages-fixture-{n}\ndate: 2020-01-01\n---\nTemporary QA content.\n',encoding='utf-8')
        out=Path(tmp)/'public'; build(source,out,'https://example.test/project/')
        assert (out/'page/2/index.html').exists() and (out/'post/page/2/index.html').exists()
    print('Static release verified: root/project paths, release boundary, search index and growth pagination. No backend required.')
def main():
    p=argparse.ArgumentParser(); p.add_argument('command',choices=['build','verify','preview']); p.add_argument('--base-url')
    a=p.parse_args()
    if not HUGO.is_file(): raise RuntimeError('缺少 Hugo，请先 python tools/manage.py setup')
    if a.command=='verify': verify()
    elif a.command=='build':
        if not a.base_url: p.error('build 需要 --base-url，填写实际 Pages 完整 URL（包含仓库路径、末尾斜线）')
        build(ROOT/'site',ROOT/'site/public',a.base_url.rstrip('/')+'/')
    else:
        # A real subdirectory preview, using production output rather than Hugo server mode.
        out=ROOT/'artifacts/pages-http/project'; build(ROOT/'site',out,'http://localhost:1313/project/')
        run([sys.executable,'-m','http.server','1313','--bind','127.0.0.1','--directory',ROOT/'artifacts/pages-http'])
if __name__=='__main__':
    try: main()
    except KeyboardInterrupt: print('\n已停止静态预览。')
    except Exception as e: print('静态发布操作失败：',e,file=sys.stderr); sys.exit(1)
