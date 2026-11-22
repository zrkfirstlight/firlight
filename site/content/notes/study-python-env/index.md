---
title: Python 中 .env 文件的介绍、使用、使用技巧、原理
slug: study-python-env
content_id: study-7214cf33ffb0e77def0870a3
date: '2025-12-24T18:04:04+08:00'
draft: false
author: firlight
lastmod: '2025-12-24T18:04:04+08:00'
series:
- python进阶
---

#  Python 中 .env 文件的介绍、使用、使用技巧、原理

总结
: .env 是存储环境变量的纯文本配置文件，核心作用是分离配置与代码，保护敏感信息；
: Python 操作 .env 的核心工具是 python-dotenv，核心步骤为「安装库 → 编写 .env → load_dotenv () 加载 → os.getenv () 获取」；
: 底层原理是：python-dotenv 解析 .env 文件，将键值对注入 os.environ 字典，实现配置全局访问；
: 关键注意点：.env 中值默认是字符串类型，需手动转换；务必将 .env 加入 .gitignore，避免敏感信息泄露；
: 工程化实践：提供 .env.example 示例文件，使用多环境 .env 文件隔离开发 / 测试 / 生产配置。

## 介绍： .env文件 与 环境变量
### .env文件
.env 是一个用于存储环境变量的纯文本配置文件，通常放置在项目根目录下， 
其核心作用是将配置信息（尤其是敏感信息，如数据库密码、API 密钥、服务端口等）与代码逻辑分离，
避免硬编码带来的安全风险和配置管理混乱。

其格式遵循「键 = 值」的简单规则，示例如下：
``` dotenv
# .env 文件内容（注释以 # 开头）
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
API_KEY=abcdefg123456
DEBUG=True
```

### 环境变量
环境变量是操作系统或应用程序运行时的动态配置参数，具有「全局可访问」「按需加载」的特性。
在 Python 项目中使用环境变量，可实现：
1. 敏感信息脱敏（不暴露在代码仓库中）
1. 多环境配置隔离（开发 / 测试 / 生产环境使用不同配置）
1. 配置灵活修改（无需改动代码，仅修改 .env 文件即可）

### 使用 .env 文件， 通过 python-dotenv
Python 标准库中没有直接解析 .env 文件的功能，
一般可以使用第三方库 python-dotenv，
此库是零依赖的库，体积超小（为什么不是标准库， 不理解）

1. 安装 python-dotenv
~~~ bash
pip install python-dotenv
~~~

2. 使用步骤（示例）
: **步骤 1：创建 .env 文件**  
: 在项目根目录下新建 .env 文件，写入配置内容（参考上文的 .env 示例）。  
: **步骤 2：编写Python 代码，加载并使用 .env 配置**

~~~python
# 导入必要模块
import os
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
# 默认加载项目根目录下的 .env 文件
load_dotenv()  

# 方式1：通过 os.getenv() 获取环境变量（推荐，不存在时返回 None，避免报错）
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
api_key = os.getenv("API_KEY")
# 布尔类型需手动转换（.env 中所有值默认是字符串类型）
debug_mode = os.getenv("DEBUG").lower() == "true"

# 方式2：通过 os.environ[] 获取环境变量（不存在时会抛出 KeyError 异常）
# db_host = os.environ["DB_HOST"]

# 打印配置信息
print(f"数据库地址：{db_host}:{db_port}")
print(f"数据库用户：{db_user}")
print(f"API 密钥：{api_key}")
print(f"调试模式：{debug_mode}（类型：{type(debug_mode)}）")

# 实际业务场景：连接数据库示例（仅演示，需安装对应数据库驱动）
# import pymysql
# conn = pymysql.connect(
#     host=db_host,
#     port=int(db_port),  # 端口号需转换为整数类型
#     user=db_user,
#     password=db_password
# )
~~~

## 使用技巧（实际就是dotenv的使用说明）
1. 指定 .env 文件路径

```python
from dotenv import load_dotenv
import os

# 自定义 .env 文件路径
env_path = os.path.join(os.path.dirname(__file__), "config", ".env")
load_dotenv(dotenv_path=env_path)  # 加载指定路径的 .env 文件， 空白代表根目录
```

2. 强制重载环境变量：
: 若系统环境变量与 .env 变量冲突，可强制使用 .env 中的值
: 如果加载的环境变量与当前系统中存在环境变量同名，会导致冲突，可以选择覆盖或者不覆盖

```python
from dotenv import load_dotenv
load_dotenv(override=True)  # 强制覆盖系统已存在的同名环境变量
```

3. .env 中值的数据类型  
: .env 文件是纯文本文件，所有配置项的值在解析后默认都是字符串类型，不存在整数、布尔值等类型区分。例如：
: .env 中的 DB_PORT=3306 解析后是字符串 "3306"，需手动转换为 int 类型才能用于数据库连接；
: .env 中的 DEBUG=True 解析后是字符串 "True"，需通过 lower() == "true" 转换为布尔值；
: 若需存储列表、字典等复杂结构，可将其序列化为 JSON 字符串，读取后再反序列化：

```dotenv
# .env 中存储 JSON 字符串
ALLOWED_HOSTS=["127.0.0.1", "localhost"]
APP_CONFIG={"name": "demo", "version": "1.0.0"}
```

```python
# Python 代码中反序列化
import json
allowed_hosts = json.loads(os.getenv("ALLOWED_HOSTS"))
app_config = json.loads(os.getenv("APP_CONFIG"))
print(type(allowed_hosts))  # <class 'list'>
print(type(app_config))     # <class 'dict'>
```
## 团队协作中的安全措施：
1. 将 .env 加入 .gitignore
.env 文件包含敏感信息（如密码、API 密钥），绝对不能提交到代码仓库（如 GitHub/GitLab），
否则会导致信息泄露。在项目根目录的 .gitignore 文件中添加 .env，让版本控制工具忽略该文件：

```plaintext
# .gitignore 文件内容
.env
__pycache__/
*.pyc
venv/
```

2. 提供示例配置文件
为了方便团队协作，可创建 .env.example 示例文件（包含配置项的键，但不包含真实敏感值），提交到代码仓库，供团队成员参考配置：
```dotenv
# .env.example 示例文件
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
API_KEY=your_api_key
DEBUG=True
```

3. 多环境配置管理
复杂项目配置多个环境，用哪个加载哪个。
```python
import os
from dotenv import load_dotenv

# 假设有 .env.dev、.env.test、.env.prod
# 获取当前环境（通过系统环境变量指定，如 export ENV=dev）
env = os.getenv("ENV", "dev")  # 默认使用 dev 环境

# 加载对应环境的 .env 文件
env_path = f".env.{env}"
load_dotenv(dotenv_path=env_path)
```


## python-dotenv  的工作原理

1. python-dotenv 的核心工作流程
: 读取文件：load_dotenv() 会按指定路径（默认项目根目录）读取 .env 文件的纯文本内容；
: 解析内容：按「键 = 值」格式逐行解析文件，忽略注释行（以 # 开头）和空行，处理特殊字符（如引号、换行符）；
: 注入环境变量：将解析后的键值对注入到 Python 进程的环境变量中（对应 os.environ 字典，这是一个存储当前进程环境变量的映射对象）；
: 全局访问：注入完成后，通过 os.getenv() 或 os.environ 即可在项目任意位置获取这些环境变量，实现配置的全局共享。

2. 为什么需要os库的参与  

    python-dotenv 本身不提供环境变量的存储和访问能力，它只负责「解析.env 文件」和「注入环境变量」，
    而 Python 中环境变量的统一管理和访问入口是os库对应的环境变量容器。
    
    python-dotenv的核心功能只有两个：
    : 一是按规则读取.env文件的文本内容并解析成键值对；
    : 二是将解析后的键值对「注入」到 Python 进程的全局环境变量容器中。
    : python-dotenv不存储这些配置，也不提供获取配置的 API，解析完成后就完成了它的使命
    
    os.environ是 Python 语言层面规定的环境变量的统一容器：
    : 一个内置的、全局的字典类型对象
    : 专门用于存储当前 Python 进程的所有环境变量（包括系统自带的环境变量，如PATH、USER，以及来自.env文件的自定义环境变量）
    : 所有环境变量的读取、修改都围绕这个容器展开。

## 硬编码及其危害
1. 硬编码是指将配置信息、敏感数据、业务参数等直接以固定值的形式写入源代码中，而非通过配置文件（如.env）、环境变量、数据库等外部方式动态获取
```python
# 硬编码：数据库密码、API密钥直接写在代码里
def connect_db():
    db_host = "127.0.0.1"
    db_user = "root"
    db_password = "MySecretPass123!"  # 敏感信息硬编码
    db_port = 3306
    # 连接数据库逻辑...

def call_api():
    api_key = "sk_abcdefg1234567890"  # API密钥硬编码
    api_url = "https://api.example.com/v1/data"
    # 调用API逻辑...
```

2. 危害：安全风险、可维护性差、协作效率低
: 代码仓库泄露、编译 / 打包泄露、团队协作泄露
: 修改成本极高、多环境配置混乱
