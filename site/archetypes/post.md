---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
slug: "{{ .File.ContentBaseName }}"
description: "填写摘要"
categories: []
tags: []
# image: cover.jpg
content_id: "{{ .File.ContentBaseName }}"
---

## 开始记录

正文放在这里。图片与 index.md 放在同一个目录。
