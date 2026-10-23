---
title: "Effective Python 实践 04：把流式处理写成可检查的小步骤"
date: 2026-10-23
draft: false
slug: effective-python-04
content_id: notes-effective-python-04
description: "用一个小型笔记索引管线，连接解析、筛选与有限消费，并保留行号、异常和资源边界。"
categories: [Python 学习]
tags: [Python, 生成器, itertools, 数据管线]
topics: [Python]
series: [Effective Python 实践：推导式与生成器]
weight: 40
---

## 每一步都能独立观察

流式代码不必写成一行。把“读取、解析、筛选、收集”分开，每个阶段就有自己的输入约定和错误位置。本篇用一个人为定义的文本格式练习：每行 `标题|分钟数`，跳过空行，分钟数必须是正整数。这不是网站现有 Markdown 的导入格式，也不会修改真实文章。

这是围绕《Effective Python》主题独立设计的练习，不复用书中代码。

```python
from io import StringIO
from itertools import islice

def parse_notes(lines):
    for line_number, line in enumerate(lines, start=1):
        text = line.strip()
        if not text:
            continue
        try:
            title, raw_minutes = text.rsplit("|", 1)
            minutes = int(raw_minutes)
            if not title.strip() or minutes <= 0:
                raise ValueError
        except ValueError as error:
            raise ValueError(f"第 {line_number} 行格式无效") from error
        yield title.strip(), minutes

with StringIO("迭代器|4\n长笔记|18\n接口设计|6\n") as source:
    notes = parse_notes(source)
    short_notes = (note for note in notes if note[1] <= 8)
    preview = list(islice(short_notes, 2))

assert preview == [("迭代器", 4), ("接口设计", 6)]
```

`islice` 在这里收集前两个符合条件的结果，不需要存下其余输出。注意“两个结果”不等于“两行输入”：中间被过滤的行也会被读取。若始终找不到第二个符合条件的结果，读取会继续到输入耗尽；提前停止不是处理时间的自动上限。

## 把消费放在资源边界之内

真实文件可以用 `with open(path, encoding="utf-8") as source` 替换 `StringIO`。生成器尚未读取完时，文件必须保持打开。不要在 `with` 内创建一个依赖文件的生成器，退出后才把它交给调用方消费。

上面的 `with` 包住了实际消费动作，即使只取少量结果，离开块时也会关闭文件。是否继续消费和资源何时释放，应由同一层代码管理。空结果也不能拿来证明“文件里的所有行都已经校验完”。

## 惰性校验有覆盖范围

如果第三条之后有坏数据，而我们只收集了前两条，坏数据不会被执行到。预览程序可以接受这种约定；需要证明整份文件合法的导入任务，就必须另行遍历全部数据完成校验，再开始不能撤销的写入。

{{< fold title="练习：确认坏数据在消费时报告行号" >}}
```python
bad = parse_notes(["正常笔记|3\n", "缺少分隔符\n"])
assert next(bad) == ("正常笔记", 3)
try:
    next(bad)
except ValueError as error:
    assert "第 2 行" in str(error)
else:
    raise AssertionError("坏数据不应静默通过")
```
{{< /fold >}}

## 回到最开始的选择

四篇笔记走过了四个问题：表达式是否清楚，计算何时执行，输入能否重读，资源和校验由谁负责。列表、循环和生成器都是工具；先确定边界，再选择写法。

可以回到学习专题从第一篇顺序复习，也可以修改上面的筛选条件，观察它会多消费多少行。不要只比较代码长度，要比较修改时能否看清行为。

参考：[Python itertools.islice](https://docs.python.org/3.12/library/itertools.html#itertools.islice)。
