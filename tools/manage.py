"""Static-only local helper. No backend, account or global environment mutation."""
import argparse, hashlib, os, subprocess, sys, urllib.request, zipfile
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
HUGO = ROOT/'tools/hugo/hugo.exe'
SHA = 'c4a2e38043b3273ae5eb16c81159cffc346d2ddf3de7819c99826d26775d7da0'

def main():
    p=argparse.ArgumentParser(description='静态博客安装/预览/验证')
    p.add_argument('command', choices=['setup','preview','verify','build'])
    p.add_argument('--base-url', help='build 使用的实际完整站点URL，包含仓库路径')
    a=p.parse_args()
    if a.command=='setup':
        if HUGO.exists():
            subprocess.run([str(HUGO),'version'],check=True)
            print('项目内 Hugo 已存在。'); return
        if os.name!='nt': raise RuntimeError('该安装入口用于Windows；其他系统请安装固定Hugo Extended 0.168.0。')
        archive=ROOT/'tools/hugo-extended.zip'
        urllib.request.urlretrieve('https://github.com/gohugoio/hugo/releases/download/v0.168.0/hugo_extended_0.168.0_windows-amd64.zip',archive)
        if hashlib.sha256(archive.read_bytes()).hexdigest()!=SHA: raise RuntimeError('Hugo SHA256不匹配，未解压。')
        HUGO.parent.mkdir(parents=True,exist_ok=True)
        with zipfile.ZipFile(archive) as z: z.extractall(HUGO.parent)
        subprocess.run([str(HUGO),'version'],check=True)
        print('项目内工具准备完成，不需要主题子模块或后端。'); return
    args=[sys.executable,str(ROOT/'tools/static_release.py'),a.command]
    if a.base_url: args += ['--base-url',a.base_url]
    subprocess.run(args,cwd=ROOT,check=True)

if __name__=='__main__':
    try: main()
    except KeyboardInterrupt: print('\n已停止。')
    except Exception as e: print('操作失败：',e,file=sys.stderr); sys.exit(1)
