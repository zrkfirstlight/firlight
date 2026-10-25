"""Read-only audit of the index, add candidates and reachable/reflog history. No account/network."""
import subprocess,re,json,sys
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
def git(*args,check=True):
    return subprocess.run(['git','-c','safe.directory='+ROOT.as_posix(),'-C',str(ROOT),*args],check=check,capture_output=True).stdout
def private(path):
    p=PurePosixPath(path); name=p.name.lower(); parts=set(p.parts)
    if name=='.env.example': return False
    if name.endswith(('.blog-backup.zip','.blog-backup.zip.sha256')) or 'migration-private' in parts:return True
    return (bool(parts & {'.venv','venv','env','__pycache__','.cache','backups','artifacts','logs','public','resources'})
            or path.startswith(('backend/data/','tools/hugo/','tools/katex/'))
            or name.startswith('.env') or p.suffix.lower() in {'.sqlite','.sqlite3','.db','.key','.pem','.p12','.pfx','.log'}
            or name in {'secret.key','jsconfig.json','hugo_stats.json','.hugo_build.lock','cloudflared.yml'}
            or bool(re.search(r'\.(?:sqlite3?|db)-(?:wal|shm|journal)$',name)))
signatures=[rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'github_pat_[A-Za-z0-9_]{60,}',rb'AKIA[0-9A-Z]{16}',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']
def secret(data): return any(re.search(p,data) for p in signatures)
def split(data): return [p for p in data.decode('utf-8').split('\0') if p]
issues=[]
tracked=split(git('ls-files','-z'))
ignored=split(git('ls-files','-ci','--exclude-standard','-z'))
for p in ignored: issues.append('已在索引中但被忽略规则排除：'+p)
candidates=sorted(set(tracked+split(git('ls-files','--others','--exclude-standard','-z'))))
for p in candidates:
    f=ROOT/p
    if private(p): issues.append('拟提交路径包含本地/私有文件：'+p)
    if f.is_file() and secret(f.read_bytes()): issues.append('拟提交文件疑似含密钥格式：'+p)
for p in tracked:
    blob=git('show',':'+p,check=False)
    if secret(blob): issues.append('暂存版本疑似含密钥格式：'+p)
commits=git('rev-list','--all','--reflog').decode().splitlines()
objects=git('rev-list','--objects','--all','--reflog').decode('utf-8').splitlines()
for row in objects:
    oid,_,p=row.partition(' ')
    if not p: continue
    if private(p): issues.append('历史路径可能包含私有文件（须人工处理，不重写历史）：'+p)
    if git('cat-file','-t',oid,check=False).strip()==b'blob' and secret(git('cat-file','blob',oid)):
        issues.append('历史内容疑似含密钥格式（须人工处理）：'+p)
result={'tracked_paths':len(tracked),'add_candidates':len(candidates),'history_commits':len(commits),'issues':issues,
        'limits':'检查路径及常见密钥格式；不声称能识别任意自定义秘密。不会提交、联网或改写历史。'}
out=ROOT/'artifacts/pages-preparation/git-audit.json'; out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
sys.exit(bool(issues))
