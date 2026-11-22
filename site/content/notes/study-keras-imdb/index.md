---
title: 电影评论分类
slug: study-keras-imdb
content_id: study-9ed92fb072cb17d79987cdd5
date: '2025-11-13T19:37:08+08:00'
draft: false
author: firlight
lastmod: '2025-11-13T19:37:08+08:00'
series:
- python深度学习
---

```python
import numpy as np
import matplotlib.pyplot as plt
from tensorflow import keras
from tensorflow.keras.datasets import imdb
from tensorflow.keras import models, layers
import re
import tensorflow as tf


def train_model():
    def vectorize_sequences(sequences, dimension=10000):
        swap = np.zeros((len(sequences), dimension), dtype=np.float32)
        for i, sequence in enumerate(sequences):
            swap[i, sequence] = 1
        return swap

    # 加载数据集（仅保留最常见的10000个单词，标签0=负面，1=正面）
    (train_data, train_labels), (test_data, test_labels) = keras.datasets.imdb.load_data(num_words=10000)

    # 显示数据集内容
    word_index = imdb.get_word_index()
    reverse_word_index = dict([(key, value) for value, key in word_index.items()])
    for i in range(5):
        print(f"标签：{train_labels[i]} \ 评价：{train_data[i]}")
        decoded_review = " ".join(reverse_word_index.get(_ - 3, "*") for _ in train_data[i])
        print(f"内容：{decoded_review} ")

    # 数据格式化
    # train_data = vectorize_sequences(train_data, train_data.shape[0])
    # test_data = vectorize_sequences(test_data, test_data.shape[0])
    train_data = vectorize_sequences(train_data, 10000)
    test_data = vectorize_sequences(test_data, 10000)
    train_labels = np.asarray(train_labels).astype('float32')
    test_labels = np.asarray(test_labels).astype('float32')

    # 模型定义
    model = models.Sequential()
    model.add(layers.Dense(16, activation='relu', input_shape=(10000,)))
    model.add(layers.Dense(16, activation='relu'))
    model.add(layers.Dense(1, activation='sigmoid'))
    # model.summary()
    model.compile(optimizer='rmsprop', loss='binary_crossentropy', metrics=['accuracy'])

    # 模型训练
    train_data_1 = train_data[:10000]   # 验证集
    train_data_2 = train_data[10000:]   # 训练集
    train_labels_1 = train_labels[:10000]
    train_labels_2 = train_labels[10000:]

    history = model.fit(
        train_data_2,
        train_labels_2,
        epochs=4,
        batch_size=512,
        validation_data=(train_data_1, train_labels_1)  # 用验证集监控过拟合
    )

    # history = model.fit(train_data, train_labels, epochs=4, batch_size=512)  # 用全量训练集训练4轮
    model.save("imdb_model.keras")

    # 模型验证
    test_loss, test_acc = model.evaluate(test_data, test_labels)
    print(f"\n测试集准确率：{test_acc:.4f}（约{test_acc * 100:.2f}%）")

    return history


def show_model(history):
    plt.rcParams["font.family"] = ["SimHei"]
    plt.rcParams["axes.unicode_minus"] = False

    # 加载数据
    history_dict = history.history
    loss_values = history_dict["loss"]
    val_loss_values = history_dict["val_loss"]
    acc_values = history_dict["accuracy"]
    val_acc_values = history_dict["val_accuracy"]

    epochs = range(1, len(loss_values) + 1)

    # 绘制损失曲线
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(epochs, loss_values, "bo-", label="训练损失")
    plt.plot(epochs, val_loss_values, "ro-", label="验证损失")
    plt.title("训练损失和验证损失")
    plt.xlabel("轮次")
    plt.ylabel("损失")
    plt.legend()

    # 绘制准确率曲线
    plt.subplot(1, 2, 2)
    plt.plot(epochs, acc_values, "bo-", label="训练准确率")
    plt.plot(epochs, val_acc_values, "ro-", label="验证准确率")
    plt.title("训练准确率和验证准确率")
    plt.xlabel("轮次")
    plt.ylabel("准确率")
    plt.legend()

    plt.tight_layout()
    plt.show()


def model_application(model):
    # 加载模型单词索引
    word_index = tf.keras.datasets.imdb.get_word_index()
    reverse_word_index = dict([(value + 3, key) for (key, value) in word_index.items()])
    reverse_word_index.update({0: "<PAD>", 1: "<START>", 2: "<UNK>"})
    # model = tf.keras.models.load_model('imdb_model.keras')

    def vectorize_sequences(sequences, dimension=10000):
        """将输入样本数据集转变成独热编码数据集"""
        results = np.zeros((len(sequences), dimension), dtype=np.float32)
        for i, sequence in enumerate(sequences):
            results[i, sequence] = 1
        return results

    def vectorize_text(review_text):
        """将输入文本向量化"""
        # 将文本转为小写并分词, 非字母字符替换为空格
        review_text = re.sub(r"[^a-zA-Z]", " ", review_text).lower()
        words = review_text.split()
        sequence = []

        for word in words:
            # index = word_index.get(word, 2) + 3  # 2代表<UNK>（未知词）
            if (index := word_index.get(word, 2) + 3) < 10000:  # 只保留在10000词表内的单词
                sequence.append(index)

        vector = vectorize_sequences([sequence])  # 向量化

        return vector


    while True:
        # 输入信息预处理
        review_text = yield
        text_vector = vectorize_text(review_text)

        # 模型测试
        prediction = model.predict(text_vector)[0][0]
        sentiment = "正面" if prediction > 0.5 else "负面"
        print(f"\n文本：{review_text}")
        print(f"预测情感：{sentiment}，置信度：{prediction:.4f}")


if __name__ == "__main__":
    is_train_model = False
    is_show_model= False
    is_test_model = False
    if is_train_model and not is_show_model:
        history = train_model()
    if is_show_model and is_train_model:
        history = train_model()
        show_model(history)
    if is_test_model:
        try:
            # 加载模型
            model = tf.keras.models.load_model('imdb_model.keras')

            tool = model_application(model)
            next(tool)
            tool.send("This movie is amazing! The acting is perfect and the story is touching.")
            tool.send("Terrible film. The plot is boring and the characters are uninteresting.")
            while True:
                tool.send(input("请输入你的评论..."))

        except Exception as e:
            if isinstance(e, ValueError):
                print("model loading error.")
            else:
                raise e
```
