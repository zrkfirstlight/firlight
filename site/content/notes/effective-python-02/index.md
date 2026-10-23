---
title: "Effective Python 实践 02：生成器把计算推迟到哪里"
date: 2026-10-23
draft: false
slug: effective-python-02
content_id: notes-effective-python-02
description: "用可观察的记录理解惰性求值：创建、第一次读取、耗尽，以及延迟出现的异常。"
categories: [Python 学习]
tags: [Python, 生成器, 惰性求值]
topics: [Python]
series: [Effective Python 实践：推导式与生成器]
weight: 20
---

## 不先算完，也是一种接口选择

上一篇用列表存下清洗后的标题。列表的特点是：创建结束时，结果已经准备好了。生成器则把工作分散到每一次取值。它改变的不只是占用空间，也包括副作用和异常出现的时间。

以下是本系列独立编写的观察例子，延续《Effective Python》的实践主题，不使用书中示例。

```python
events = []

def observed_squares(values):
    for value in values:
        events.append(value)
        yield value * value

stream = observed_squares([2, 3, 4])
assert events == []
assert next(stream) == 4
assert events == [2]
assert list(stream) == [9, 16]
assert list(stream) == []
```

创建 `stream` 时，函数体还没有开始执行。第一次 `next()` 才进入循环，到 `yield` 暂停；下一次从暂停处继续。最后一次读取结束后，这个生成器已经耗尽，不能回到开头。

## 少存结果，不等于没有内存成本

生成器表达式适合把简单映射交给一个消费者：

```python
total = sum(value * value for value in range(5))
assert total == 30
```

这里没有创建“所有平方值”的中间列表。但输入可能本来就是大列表，生成器也会保留执行状态；如果再调用 `list(...)` 收集全部输出，最终仍要为结果分配空间。只根据括号形状判断程序省内存，会漏掉真正持有数据的地方。

还有一处细节：生成器表达式最左侧的可迭代表达式会在创建表达式时求值。不要把“结果逐个产生”理解为“括号内一切都延后”。简单的契约比记住一个笼统口号更可靠。

## 错误也可能被推迟

```python
numbers = (int(text) for text in ["12", "not-a-number"])
assert next(numbers) == 12
try:
    next(numbers)
except ValueError:
    pass
else:
    raise AssertionError("第二次读取应当暴露非法数字")
```

如果这段数据交给另一个函数，异常可能在那个函数消费时出现。需要“先验证所有输入，再开始外部操作”时，不要盲目流式化。可以先明确做一次校验，或者让每次写入具有独立、可恢复的边界。

## 选列表还是生成器

需要随机访问、重复遍历、准确长度，或者需要立刻暴露全部转换错误时，列表往往更直接。只消费一次、逐项处理、可能提前停止时，生成器更合适。选择依据是调用方怎么用，而不是哪种写法看起来更高级。

下一篇讨论常见的陷阱：同一份输入，为什么第一次统计正常，第二次却得到空结果？

参考：[Python 生成器](https://docs.python.org/3.12/tutorial/classes.html#generators)、[生成器表达式的求值规则](https://docs.python.org/3.12/reference/expressions.html#generator-expressions)。
