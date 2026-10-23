---
title: "Effective Python 实践 03：别把一次性迭代器当成列表"
date: 2026-10-23
draft: false
slug: effective-python-03
content_id: notes-effective-python-03
description: "让两遍算法的输入约定显式化：选择快照，或者传入每次创建新迭代器的工厂。"
categories: [Python 学习]
tags: [Python, 迭代器, 接口设计]
topics: [Python]
series: [Effective Python 实践：推导式与生成器]
weight: 30
---

## 同一个 for，并不保证同一个起点

列表可以反复遍历；一个已经推进的迭代器则从当前位置继续。用 `for` 遍历它们的语法相同，行为却不同。

```python
values = [2, 3, 5]
cursor = iter(values)
assert iter(cursor) is cursor
assert sum(cursor) == 10
assert list(cursor) == []
assert list(values) == [2, 3, 5]
```

这不是生成器的专属问题：文件对象、`map()` 返回值等也可能只向前推进。把“能放进 for”当成“能重新读一遍”，接口就容易埋雷。

本篇延续《Effective Python》的实践主题，例子为独立编写。下面只处理**有限个非负数，且总和大于零**的简单输入；实际业务还应按需要限制数值类型和范围。

## 方案一：明确生成快照

```python
def shares_snapshot(values):
    snapshot = list(values)
    total = sum(snapshot)
    if any(value < 0 for value in snapshot) or total <= 0:
        raise ValueError("需要非负数且总和大于零")
    return [value / total for value in snapshot]

assert shares_snapshot(iter([2, 3, 5])) == [0.2, 0.3, 0.5]
```

先收集一次，再计算两遍。这让函数同时接受列表和一次性迭代器，代价是存下全部输入。对于几十条、几百条的小数据，明确的快照通常值得；不要用它接收无限序列。

快照还固定了这次计算的数据集合。不过 `list()` 是浅复制，输入若是可变对象，它并不会深度冻结内部状态；本例只用数值。

## 方案二：要求调用方提供新的读取过程

如果输入很大，可以让调用方传入工厂，而不是已经创建的迭代器：

```python
def shares_factory(make_values):
    total = sum(make_values())
    if total <= 0:
        raise ValueError("总和必须大于零")
    return [value / total for value in make_values()]

assert shares_factory(lambda: iter([2, 3, 5])) == [0.2, 0.3, 0.5]
```

这个版本还要求工厂每次返回**相同的有限非负数序列**。返回同一个已耗尽的生成器，或者每次返回不同的实时数据，都违背约定。这里的输出仍是列表，所以只省掉了输入快照，并非整个算法都恒定占用内存。

两次打开变化中的文件，还需要考虑读到不同版本的问题。若一致性重要，可以先固定文件版本或使用快照方案。重新可读与内容不变，是两个不同保证。

## 在接口处说清楚

一个函数只消费一遍，就说明这一点；需要重复读取，就选择快照或工厂，并写出代价。与其靠“聪明”的类型检测猜测调用方意图，不如让参数名称和文档体现契约。

最后一篇把逐项读取、过滤和提前停止组合起来，同时处理资源关闭与坏数据。

参考：[Python 迭代器](https://docs.python.org/3.12/tutorial/classes.html#iterators)。
