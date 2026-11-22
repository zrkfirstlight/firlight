---
title: 算法糖
slug: study-python-namedtuple
content_id: study-27395784abb610df7d218ba9
date: '2025-10-31T21:22:18+08:00'
draft: false
author: firlight
lastmod: '2025-12-24T18:04:04+08:00'
series:
- python进阶
---

备注：为了便捷做笔记，部分内容为AI生成，使用时要小心。
# 算法糖
不引入新功能，但能大幅简化代码，让逻辑更清晰，能显著提升代码编写效率和可读性。

## 1. 具名元组namedtuple
具名元组（namedtuple） 是 collections 模块提供的一个工具，用于创建带有字段名的元组子类,结合了元组的轻量性（内存效率高、不可变）和类的可读性（可通过字段名访问元素），适合用来定义简单的数据结构（如坐标、人员信息、配置项等）。

### 具名元组的核心特点：  
1. 不可变：和普通元组一样，实例创建后字段值不能修改（保证数据安全性）。
2. 字段名访问：可通过 实例.字段名 访问元素（比普通元组的索引访问更直观）。
3. 轻量高效：比自定义类更节省内存，性能接近普通元组。
4. 自带实用方法：如 _fields（查看所有字段名）、_make（通过可迭代对象创建实例）、_asdict（转换为字典）等。

### 示例：
1. 简单示例

        from collections import namedtuple  # 导入

        # 方式1：字段名用列表表示
        Point = namedtuple("Point", ["x", "y"])

        # 方式2：字段名用空格分隔的字符串表示
        Point = namedtuple("Point", "x y")

        # 通过定义的类创建实例，传入字段对应的值（顺序需与定义时一致）：
        p1 = Point(3, 5)
        print(p1)  # 输出：Point(x=3, y=5)

2. 功能展示(接上)

        # 访问字段值     
        print(p1.x)   # 通过字段名访问 x 坐标，输出：3
        print(p1.y)   # 通过字段名访问 y 坐标，输出：5
        print(p1[0])  # 通过索引访问第一个字段，输出：3（兼容元组）

        # _fields 查看所有字段名（返回元组）
        print(Point._fields)  # 输出：('x', 'y')

        # _make(iterable)：通过可迭代对象（如列表、元组）创建实例
        coords = [10, 20]
        p2 = Point._make(coords)  # 等价于 Point(10, 20)

        # _asdict()：将实例转换为 普通字典
        p2_dict = p2._asdict()
        print(p2_dict)  # 输出：{'x': 10, 'y': 20}  

        # _replace(**kwargs)：创建一个修改了指定字段的新实例（原实例不变，因不可变）
        p3 = p2._replace(y=30)  # 修改 y 字段为 30
        print(p2)  # 原实例不变：Point(x=10, y=20)
        print(p3)  # 新实例：Point(x=10, y=30)

3. 复杂场景示例：员工信息

        # 定义员工具名元组（包含id、姓名、部门、薪资）
        Employee = namedtuple("Employee", "id name department salary")

        # 创建员工实例
        emp1 = Employee(1001, "张三", "技术部", 8000)
        emp2 = Employee(1002, "李四", "市场部", 7500)

        # 访问信息（通过字段名，代码可读性高）
        print(f"{emp1.name} 在 {emp1.department}，薪资：{emp1.salary}")
        # 输出：张三 在 技术部，薪资：8000

        # 转换为字典（方便序列化或打印）
        print(emp2._asdict())
        # 输出：{'id': 1002, 'name': '李四', 'department': '市场部', 'salary': 7500}

### 适用场景：
1. 存储简单的数据结构（如坐标、日期、配置参数）。
2. 替代普通元组，提升代码可读性（避免通过索引 [0] [1] 访问的歧义）。
3. 作为轻量级的 “数据类”，比自定义 class 更简洁（无需写 __init__ 等方法）。

### 注意：
1. 具名元组是不可变的，若需要修改字段值，需用 _replace 创建新实例。
2. 字段名不能是 Python 关键字（如 class、def），否则会报错。
3. 若需要更复杂的功能，请自己写类。