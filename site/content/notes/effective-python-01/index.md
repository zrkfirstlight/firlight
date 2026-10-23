---
title: "Effective Python 实践 01：让推导式只做一件事"
date: 2026-10-23
draft: false
slug: effective-python-01
content_id: notes-effective-python-01
description: "从整理一份标题清单开始，区分映射、筛选和校验，给一行代码设置可读性的边界。"
categories: [Python 学习]
tags: [Python, 推导式, 可读性]
topics: [Python]
series: [Effective Python 实践：推导式与生成器]
weight: 10
---

## 先给一行代码一个边界

推导式适合表达“从一组值生成另一组值”。如果一行里同时出现清洗、分支、异常处理和写文件，它虽然短，读起来却未必轻松。

这一组四篇笔记围绕《Effective Python》的推导式与生成器主题展开，使用独立编写的例子，不是书籍翻译、摘录或替代品。这里只讨论 Python 3.12 及以上版本都能运行的基础行为，不绑定不同版本书籍的条目编号。书籍信息可见[作者官网](https://effectivepython.com/)。

先从一个小任务开始：把已经确认是字符串的标题列表去掉首尾空白，并过滤空标题。

```python
raw_titles = [" 生成器入门 ", "", "  ", "写作与代码"]
cleaned = [title.strip() for title in raw_titles]
titles = [title for title in cleaned if title]
assert titles == ["生成器入门", "写作与代码"]
```

这里刻意分成两步：第一步映射，第二步筛选。检查中间结果容易，也无需为了省一行反复调用 `strip()`。列表不大时，这点明确性比少一个临时列表更有价值；数据量大的情况留到后面讨论。

## 循环没有输给推导式

如果希望知道哪条标题不符合规则，就保留循环。错误信息和累积结果都是明确的步骤，不必塞进一个表达式。

```python
def normalize_titles(values):
    result = []
    for position, value in enumerate(values, start=1):
        if not isinstance(value, str):
            raise TypeError(f"第 {position} 条标题不是字符串")
        title = value.strip()
        if title:
            result.append(title)
    return result

assert normalize_titles(raw_titles) == titles
```

不要用 `str(value)` 静默接收所有对象：把 `None` 变成标题 `"None"`，可能让原本应该暴露的数据错误悄悄进入页面。输入契约应先讲清楚：这个函数要的是字符串，不是“任何可以转成字符串的东西”。

## 什么时候应该拆开

当你需要停下来数 `for` 和 `if` 的归属，或者需要在出错时指出具体行号，就可以拆成普通循环或辅助函数。不是禁止嵌套，而是为下一次修改留出位置。

例如项目按主题分组时，扁平化和筛选可能是两个不同需求。先把每一步命名清楚，再决定是否压缩；不要把“一行完成”当目标。

{{< fold title="练习：保留短标题，并确认原列表没有被修改" >}}
在上面的结果中筛选长度不超过 6 的标题：

```python
short_titles = [title for title in titles if len(title) <= 6]
assert short_titles == ["生成器入门", "写作与代码"]
assert raw_titles[0] == " 生成器入门 "
```

这个例子里的 `len()` 计算字符串码点数量，不是所有语言情况下的视觉字符宽度。界面截断不能简单照搬这一规则。
{{< /fold >}}

这一篇先接受列表带来的清晰性。下一篇再讨论：如果我们只需要少量结果，是否必须提前把所有结果都算出来？

语法参考：[Python 列表推导式](https://docs.python.org/3.12/tutorial/datastructures.html#list-comprehensions)。
