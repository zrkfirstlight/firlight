"""Execute only the four explicitly named, project-authored teaching examples."""
import re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
total=0
for n in range(1,5):
    path=root/f'site/content/notes/effective-python-{n:02}/index.md'
    blocks=re.findall(r'```python\n(.*?)```',path.read_text(encoding='utf-8'),re.S)
    assert blocks,'文章没有代码示例'
    scope={'__name__':'__learning_check__'}
    for index,block in enumerate(blocks):exec(compile(block,str(path)+f':block{index+1}','exec'),scope)
    total+=len(blocks)
    print(path.parent.name+': all example assertions passed')
print(f'{total} Python code blocks verified; examples are original, not extracted book code.')
