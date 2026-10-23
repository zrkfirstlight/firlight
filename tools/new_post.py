"""Create one Hugo leaf bundle. No network, Git commit, overwrite or document execution."""
import argparse,json,re,sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
from uuid import uuid4
ROOT=Path(__file__).resolve().parents[1]

def create_post(root,title,slug,kind='post',body='',publish=False,series=''):
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or len(slug)>80:
        raise ValueError('slug 请用不超过80位的小写英文字母、数字和单短横线。')
    if kind not in {'post','notes','discovery','project'}:raise ValueError('无效内容类型')
    if not title.strip() or len(title)>200:raise ValueError('标题需为1–200个字符。')
    if body.lstrip('\ufeff\r\n ').startswith('---'):raise ValueError('导入文件请只保留正文，移除开头的 front matter；新元信息由工具生成。')
    folder=root/'site/content'/kind/slug
    if folder.exists():raise FileExistsError('目录已经存在，不会覆盖：'+str(folder))
    q=lambda value:json.dumps(value,ensure_ascii=False)
    fields=[f'title: {q(title.strip())}',f'date: {datetime.now(timezone(timedelta(hours=8))).date()}',f'draft: {str(not publish).lower()}',f'slug: {q(slug)}',f'content_id: {q(kind+"-"+slug+"-"+uuid4().hex[:8])}','description: "请填写摘要"','categories: []','tags: []','topics: []']
    if kind=='notes':fields += [f'series: [{q(series)}]' if series else 'series: []','weight: 10']
    if kind=='discovery':fields+=['discovery_kind: "article"']
    if kind=='project':fields+=['status: "待填写"']
    folder.mkdir(parents=True,exist_ok=False)
    target=folder/'index.md'
    target.write_text('---\n'+'\n'.join(fields)+'\n---\n\n'+(body.strip() or '## 正文\n\n从这里开始写。')+'\n',encoding='utf-8')
    return target

def main():
    p=argparse.ArgumentParser(description='新建文章或导入Markdown/UTF-8文本正文，默认草稿、不覆盖、不提交。')
    p.add_argument('--title',required=True);p.add_argument('--slug',required=True)
    p.add_argument('--kind',choices=['post','notes','discovery','project'],default='post')
    p.add_argument('--from-file',type=Path);p.add_argument('--series',default='')
    p.add_argument('--publish',action='store_true',help='仅设draft=false；仍需人工预览、Git提交和推送')
    a=p.parse_args();body=''
    if a.from_file:
        if a.from_file.suffix.lower() not in {'.md','.txt'}:p.error('只接收 .md/.txt 正文；Word请另存UTF-8文本，图片另外整理。')
        if a.from_file.stat().st_size>1024*1024:p.error('正文超过1MB，请先检查是否误选文件。')
        body=a.from_file.read_text(encoding='utf-8-sig')
    print('已创建：',create_post(ROOT,a.title,a.slug,a.kind,body,a.publish,a.series))
    print('尚未提交或上传。请补摘要/主题，放图片，预览后再发布。草稿文件进入公开Git也会被人看到。')
if __name__=='__main__':
    try:main()
    except (OSError,ValueError) as e:print('创建失败：'+str(e),file=sys.stderr);sys.exit(1)
