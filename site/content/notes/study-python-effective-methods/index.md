---
title: 读书笔记：《编写高质量python代码的59个有效方法》
slug: study-python-effective-methods
content_id: study-c4c9b5239934a7a4c5cfeff7
date: '2025-10-24T21:18:29+08:00'
draft: false
author: firlight
lastmod: '2025-12-24T18:04:04+08:00'
series:
- python进阶
---

# 书籍信息
书名：《编写高质量python代码的59个有效方法》  
作者： Brett Slatkin  
评论： 我买的版本是16年的，书中主要涉及py2和py3.4，可以说我买到的那一刻这本书的内容就严重过时了，幸好此书主要讲述pythonic，这正是我所欠缺的，因此我一边看，一边应用，一边批判，最终提升我对python代码码风的理解。  

# Pythonic （代码风格）

## 1. python 版本
py2、py3、py3.8 -- 大版本  
每年一个年度版本、每个年度版本中有稳定版、发行版、测试版、  
不同大版本之间关系，小版本关系、版本间关系、项目环境关系  
项目运行所需环境：py解释器、支持库

## 2. pep8风格
了解就行，不强制遵循

## 3. bytes、str、unicode区别
字符与字符串区别、子啊文本中的储存方式不同引起，默认utf-8即可

## 4. 推荐使用辅助函数
辅助函数主要意义在代码***简化与复用***

## 5. 序列切割
所有实现了魔法方法getitem和setitem的类均支持，常见的就是列表和字符串

## 6. 序列切割时，不要写太复杂的格式
想写啥写啥、什么年代了

## 7. 用列表推导来取代map和filter
推导式好用，类似与map，这里的filter只是混进来的莫名的内置函数

## 8. 列表推导不要嵌套两层以上
主要是便于查看，实际上非常推荐，但是不这么做一点问题没有

## 9. 数据量大的列表推导用生成器来实现
防止瞬时内存占用过大导致程序崩溃



## 10. 利用enumerate 代替 range
这是人尽皆知的技巧，一种在遍历迭代器的同时，快捷的获取内容的索引

## 11. 用zip遍历两个迭代器
用于平行的遍历多个迭代器，同时不需要担心索引溢出。

## 12. 不使用 for - else/ while - else
这两种语法结构的特点在于，如果循环过程中没有被break所终止，那么会额外运行else中的内容，相反，如果循环过程中被break打断，那么else中的语句就不会被执行。

一般用于判断某个范围中的数据，是否都**不满足**某个条件，但是完全可以使用辅助函数来达到同样的效果，并且辅助函数更易读，示例如下

    def func(*args):
        for i in range(10):
            if ...:
            return false
        return ture

## *13.try-except-else-finally语法应对不同场景*
主要用于错误处理，根据不同场景选择不同结构使用，个人一般try/except就够用了

### 1. try-finally

无论try是否会报错，finally都会被执行，一般是用于进行数据清理。

    handle = open("data.txt")
    try:
        data =  handle.read()
    finally:
        handle.close()

若文件数据无法被打开，那么try中会报错，此时文件句柄已经被锁定，因此需要被释放。至于try中的报错，则是掷出由更高级的代码来处理。所以，外面至少应当在嵌套一层才能保证代码的整体稳定性。正如下面的代码所写。

    try:
        handle = open("data.txt")   # 文件打开错误
        try:
            data =  handle.read()   # 数据读取错误
        finally:
            handle.close()          # 数据读取错误时保证句柄关掉，若文件打开错误，则不会被执行
    except Error as e:
        raise

### 2.else
else的作用是当try语句块不报错的时候执行，我有时在想，这是在干什么，其实这是一种错误处理的思路。分析下面的代码，json.loads(data)的时候可能会报错 ValueError，这个时候，我掷出KeyError。如果不报错，我读取文件中的数据，然后将其返回。

为什么掷出KeyError，这是因为result_dict[key]可能报错KeyError，因此在这一步进行错误类型的隐瞒，但是通过 KeyError from e又保留了报错的具体信息。

else意义，try和else分开的意义，这段代码只能处理ValueError，因此其他的错误需要掷出，但是else中语句不会出现ValueError错误，因此认为它是安全的不需要考虑的，仅考虑可能出现ValueError的try代码。

这里的思想就是，代码的错误传播更加的清晰，我知道那些代码可能会出现什么样子的错误。一般大团队用来维护大项目的时候，这种处理方法会很好用，如果是个人的话，那就算了吧。


    def load_json_key(data, key):
        try:
            result_dict = json.loads(data)
        except ValueError as e:
            raise KeyError from e
        else:
            return result_dict[key] 

### 3.try-except-else-finally

这四部分代码各司其职，相互配合，是一个非常有用的写法。

try/except代码块，写那些可能报错的代码，并给出对应的处理方式。else语句一方面是分割风险代码和正常代码，一方面是可以将错误信息正常掷出，一方面是可以在清理工作前执行额外工作。finally则是进行清理工作，如果进入了try，那么一定会执行一些清理工作，因此肯会导致没有清理工作的代码应当是在try代码段前面的。

    def divide_json(path):
        handle = open(path, 'r+')
        try:
            data = handle.read()
            json_data = json.loads(data)
            value = json_data['value1'] / json_data['value2']   # 除0错误
        except ZeroDivisionError as e:
            return UNDEFINED
        else:
            json_data[answer] = value
            result = json.dumps(json_data)
            handle.seek(0)
            handle.write(result)
            return value
        finally:
            handle.close()

在这段代码里面，即使else返回了值，但是finally的语句还是会在返回值之前执行，只有清理工作做完了之后，才会真的返回函数值。

# 函数
## 14. 特殊情况用异常来表示，而不是用None来表示
在两数相除的场景下，除0 是不被允许的，例如如果我们这样写，显然是看不出来错误的，但是我们在调用的时候会出错

    def divide(a, b):
        try:
            return a / b
        except ZeroDivisionError；
            return None

我们很可能会这样处理，看起来是正确的，但是因为python中0, false, None在条件判断中是视同的，因此分子为0时，输入没有错误，但是我们却认定输入错误了，显然这样就会产生无形的错误，这次可以看出，下次呢？

    result = divide(5, 0)
    if result is None:
        print("输入错误“)

解决方法就是在函数中，遇到特殊情况，直接掷出错误。然后我们在调用函数的时候，遇到了掷出的错误，然后就去处理它就好了。

    def divide(a, b):
        try:
            return a / b
        except ZeroDivisionError as e；
            return ValueError("invalid inputs") from e

    try:
        result = divide(5, 0)
    except ValueError：
        print("invalid inputs")
    else:
        print(f"result is {result}")

## 15.在闭包中使用外围作用域的变量
### 0.闭包的概念和基本用途
闭包是一个比较综合的概念，有一个定义是：函数内部的嵌套函数可以在函数结束后仍然使用函数局部变量中的函数。如下，嵌套函数counter在外部函数make_counter被执行完后，还是可以使用外部作用域中的count变量。

    def make_counter():
        count = 0  # 外部函数的局部变量，被闭包“记住”
        
        def counter():
            nonlocal count  # 声明修改外部变量
            count += 1
            return count
        
        return counter

    counter1 = make_counter()
    print(counter1())  # 1
    print(counter1())  # 2

    counter2 = make_counter()  # 新的闭包，拥有独立的count
    print(counter2())  # 1

一般来讲，闭包的作用是将外部函数中的信息进行隐藏，实现了封装；保存外部函数中的信息，使其可以持续存在。  
在封装的效果上，和类的封装是差不多的，在简单的场景下，会使用闭包来做。  
还有一种用法就是装饰器，在不修改原代码的基础上，动态的为函数添加新的功能，但终究不是纯粹的闭包了。

### 1.书中的例子
书中并没有强调闭包本身，而是在强调使用闭包时，对作用域的控制，扩展一下，就是使用闭包时，怎么避免或者利用不同作用域之间的污染。   
下面一段代码，实现对数据进行排序，检查是否有重点对象并返回标志，重点对象的优先级最高。

    def sort_priority(numbers, group):
        found = False
        def helper(x):
            if x in group:
                found = True
                return (0, x)
            return (1, x)
        numbers.sort(key=helper)
        return found

    numbers = [2,5,9,6,3,4,7,8,5,1]
    found = sort_priority(numbers, {4,6,2,9})
    print(f"found", found)
    print(numbers)
    # found False
    # [2, 4, 6, 9, 1, 3, 5, 5, 7, 8] 

可以看到，函数的返回值不是预料值，这是因为尾部函数和内部函数的作用域没有打通，要想打通，那就是用nonlocal关键字，如下： 

    def sort_priority(numbers, group):
        found = False
        def helper(x):
            nonlocal found
            if x in group:
                found = True
                return (0, x)
            return (1, x)
        numbers.sort(key=helper)
        return found

    numbers = [2,5,9,6,3,4,7,8,5,1]
    found = sort_priority(numbers, {4,6,2,9})
    print(f"found", found)
    print(numbers)
    # found True
    # [2, 4, 6, 9, 1, 3, 5, 5, 7, 8]

nonlocal和global有些相似，都是将不同作用域进行关联，但是nonlocal只能打通一层作用域，而global时全局作用域，实际上，使用nonlocal不如直接声明类。

    def sort_priority():
        found = False
        def helper():
            nonlocal found
            found = True

        helper()
        return found

    found = False
    found_local = sort_priority()
    print(f"local found", found_local)
    print(f"global found", found)
    # local found True
    # global found False

将内部作用域与外部作用域打通了，对全局作用域不起作用。

    def sort_priority():
        found = False
        def helper():
            global found
            found = True

        helper()
        return found

    found = False
    found_local = sort_priority()
    print(f"local found", found_local)
    print(f"global found", found)
    # local found True
    # global found False

将内部作用域与全局作用域打通了，对外部作用域不起作用。

    def sort_priority():
        nonlocal found 
        found = True
        return found

    found = False
    found_local = sort_priority()
    print(f"local found", found_local)
    print(f"global found", found)

    #     nonlocal found
    #     ^^^^^^^^^^^^^^
    # SyntaxError: no binding for nonlocal 'found' found

仅有函数作用域和全局作用域，因此nonlocal不能找到外部作用域而失效。


## 16.使用生成器来改写直接返回列表的函数
只能说根据需要来吧，这几种写法一般是没有啥问题的，生成器是惰性的，也就是他不会瞬间释放大量的内存，但是如果重复索引就不如列表灵活了。如果仅仅是单纯获取一次数据，类似生产者和消费者那样，在不考虑内存的情况下，列表是微微快于生成器的。

读取一段字符串中的所有单词的首字母，并返回其索引位置。需要函数返回一系列结果，可以使用列表直接返回结果，也可以直接返回一个生成器（迭代器）。

    def index_words(text):
        result = []
        if text:
            result.append(0)
        for index, letter in enumerate(text):
            if letter == ' ':
                result.append(index + 1)
        return result

    address = "long long years ago"
    result = index_words(address)
    print(result)

这是一个很常见的使用列表返回结果的写法。

    def index_words(text):
        yield 0
        for index, letter in enumerate(text):
            if letter == ' ':
                yield index + 1

    address = "long long years ago"
    result = list(index_words(address))
    print(result)

这是一个很常见的使用生成器返回结果的写法。

    from itertools import islice

    def index_file(f):
        result = 0
        for line in f:
            if line:
                yield result
            for letter in line:
                result += 1
                if letter == ' ':
                    yield result

    with open("data.txt", 'r') as f:
        swap = index_file(f)
        result = islice(swap, 0, 4)
        print(list(result))
        print(list(swap))

这是利用生成器来获取一个文件中，所有单词首字母索引的常见写法

## 17. 生成器只能迭代一次

1. 一个生成器在全局只能迭代一次
2. 可以用可产生生成器的匿名函数来代替
3. 自定义可迭代的容器来代替

意外发现：python允许一个文件被多次同时打开，只要不是读写独占即可，下面是示例：

    class Reader:
        def __init__(self, path):
            self.path = path

        def __iter__(self):
            with open(self.path, mode='a+') as f:
                f.seek(0)
                for line in f:
                    yield line

    visits0 = Reader('data.txt')
    visits1 = Reader('data.txt')
    print(next(iter(visits0)))
    print(next(iter(visits1)))
 
## 18.用可变参数减少视觉杂讯
这里是函数的可变参数传入即*args， **kwargs的用法。涉及解包打包的知识。
存在问题如下：
1. 传入参数需要将可变长变量转化为元组，因此需要迭代，所以参数数量不能太多
2. 更新时会产生难以发现的bug，推荐使用关键字形式指定的参数来更新。

        def log(message, *values):
            if not values:
                print(message)
            else:
                print(message, values)
                print(message, *values)

        log(1)
        log(1, 345)
        # 1
        # 1 (345,)
        # 1 345


## 19. 关键字参数来优化传入参数
注意：
1. 位置参数必须在关键字参数前面
2. 关键字参数仍可使用位置参数来指定

有优点： 
1. 易读
2. 缺省
3.可维护

建议：
1. 有关键字参数就使用关键字形式

示例：

    def flow_rate(weight_diff, time_diff, period = 1, units_per_kg=1):
        return weight_diff * time_diff / units_per_kg * period


## 20.函数参数的动态默认值，使用None和说明
函数的默认值参数是在加载模块的时候确定下来的，确定之后不会因调用信息而发生变化。

此外，还有一种情况，就是我的默认值参数是可变数据类型，然后函数调用或者返回值使用到了这个默认参数，那么所有的行为，都是对一个可变数据类型的参数进行修改的。

如下，我们希望可以打印日志和日志时间，显然不同日志的时间戳时不一样的，但实际打印值一样。

    import time

    def log(message, when=time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())):
        print(when, message)

    log("message1")
    time.sleep(1)
    log("message2")

    # 2025-10-31 16:09:39 message1
    # 2025-10-31 16:09:39 message2

我们推荐下面的写法，将动态默认值改为None，并在文档字符串中进行说明，如下：

    import time

    def log(message, when=None):
        """打印消息和消息时间
            
        :param message: 消息内容
        :param when: 消息传入时间
        """
        when = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()) if when is None else when
        print(when, message)

    log("message1")
    time.sleep(1)
    log("message2")

    # 2025-10-31 16:14:12 message1
    # 2025-10-31 16:14:13 message2

同样的，可变数据类型作为默认参数也是不推荐的。这会导致变量错误重复利用。

## 21. 只能通过关键字形式指定的参数，确保代码含义清晰

形如 def func(param1, param2, *, param3=3, param4=4)， 使得第三个和第四个参数只能通过关键字形式进行指定。和**kwargs是完全不一样的，但实际上，整个过程是可以通过 **kwargs来实现的，本质功能相同，可能是一种算法糖吧

看下面的示例，我们想要一个安全的除法器，可以自定义忽略那些错误。但是我们在调用的时候，可能会忘记参数的实际意义，还有我们可能通过位置参数错误的传入不想要的指令，因此我们希望有只能通过关键字形式指定的参数。


    def safe_division(number, divisor, ignore_overflow, ignore_zero_division):
        """一种可以忽略参数异常的除法函数

        :param number: 分子
        :param divisor: 分母
        :param ignore_overflow: 是否忽略计算溢出错误
        :param ignore_zero_division: 是否忽略除零错误
        :return: 结果
        """
        try:
            return number / divisor
        except OverflowError:
            if ignore_overflow:
                return 0
            else:
                raise
        except ZeroDivisionError:
            if ignore_zero_division:
                return float('inf')
            else:
                raise

    print(safe_division(1.0, 10 ** 500, True, False))
    print(1.0/ 10 ** 500)

    #     print(1.0/ 10 ** 500)
    #           ~~~^~~~~~~~~~~
    # OverflowError: int too large to convert to float
    # 0

    print(safe_division(1.0, 0, False, True))

    # 0
    # inf


我们可以这样重新定义, 那么一般的使用者就可以将它作为普通除法器使用，而专业使用者就可以能加灵活的使用它了。

    def safe_division(number, divisor, *，ignore_overflow=False, ignore_zero_division=False):

# 类

## 22. 用辅助类来维护程序状态，避免过长的字典、元组、复杂逻辑
这是一个关于程序面临可扩展性与需求之间的博弈。唯有经理一个开发过程才能理解。

1. 需求简单、不需扩展：直接最简单的数据结构就可以
2. 需求简单、大量扩展：似乎没有这种情况，请使用具名数组等节省开销的方法
3. 需求复杂、大量扩展：老老实实的将所有逻辑和数据结构进行拆分，尽量不要循环嵌套，字典嵌套等行为。
4. 需求转变：宁可最复杂，不要简单。

## 23. 类的接口，回调函数优于带call魔法命令的类的对象
坦白说，没看懂

回调函数：用于动态的扩展功能，或者检测程序运行情况

字符串代码，通过eval运行表达式并获得结果，通过exec创建函数，不返回结果

## 24. 类方法实现构造多态
1. 实例方法多态针对实例，目标为不同类的实例拥有不同的行为。类方法多态针对类，其针对类本身进行操作
2. 一个工作流中，有多个抽象，需要凭借函数来链接这些类，实现工作流。而类方法多态可以使得这样的链接函数更加的通用。
3. python中对于类的构造函数只有一种__init__，因此采用cls来构造类的实例

    class Animal:
        def __init__(self, name):
            self.name = name
    
        def show_name(self):
            print(self.name)
    
        @classmethod
        def generate(cls, name):
            return cls(name)
    
    a = Animal("cat")
    a.show_name()
    b = Animal.generate("dog")
    b.show_name()
    c = Animal
    d = c.generate("cat")
    d.show_name()

根据上述示例，可以基于动态的方式实现书中所给的示例，但是类方法还有这很多独特的作用。利用计数器、类属性的封装、类的唯一实例

## 25. 使用super函数来确定方法解析顺序
很经典、当一个类同时继承多个类，而这些类又有公共基类的时候，不可避免的出现：
构造函数调用顺序、构造函数重复调用，采用super来解决这个问题
采用默认的mro类方法来查看实际循序

## 26. 

0. 类的__dict__魔法属性，有利也有弊














