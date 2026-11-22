---
title: 新闻分类
slug: study-keras-reuters
content_id: study-bd3ce7e178f0a4d933232802
date: '2025-12-05T18:08:01+08:00'
draft: false
author: firlight
lastmod: '2025-12-05T18:08:01+08:00'
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
from tensorflow import keras
import tensorflow as tf
from tensorflow.keras.datasets import reuters
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, Activation
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.utils import to_categorical

import numpy as np
import matplotlib.pyplot as plt



def train_model():
    # 加载数据集（仅保留最常见的10000个单词，标签0=负面，1=正面）
    (train_data, train_labels), (test_data,  test_labels) = keras.datasets.reuters.load_data(num_words=10000)

    # 显示数据集内容
    word_index = keras.datasets.reuters.get_word_index()
    reverse_word_index = dict([(value, key) for (key, value) in word_index.items()])
    text = ' '.join([reverse_word_index.get(_ - 3, "*") for _ in train_data[0]])

    print(f"训练样本数：{len(train_data)}，测试样本数：{len(test_data)}")
    print(f"第一个训练样本（单词索引序列）：{train_data[0][:10]}...")
    print(f"第一个训练样本的原始文本: {text}")
    print(f"第一个训练样本的形状: {len(train_data[0])}")
    print(f"第一个训练样本标签：{train_labels[0]}（对应某个主题类别）")
    print(f"总共有 {len(np.unique(train_labels))} 个类别")

    # 数据格式化
    vocab_size = 10000 # 设置词汇表大小
    num_classes = 46 # 总共有 46 个类别
    # 使用 Tokenizer 进行 one-hot 编码
    tokenizer = Tokenizer(num_words=vocab_size)
    x_train = tokenizer.sequences_to_matrix(train_data, mode='binary')
    x_test = tokenizer.sequences_to_matrix(test_data, mode='binary')
    y_train = to_categorical(train_labels, num_classes)
    y_test = to_categorical(test_labels, num_classes)

    # 模型设计
    model = Sequential()
    model.add(Dense(512, activation='relu', input_shape=(vocab_size,)))
    model.add(Dropout(0.5)) # Dropout 层用于防止过拟合，它会随机丢弃 50% 的神经元
    model.add(Dense(num_classes, activation='softmax'))
    # model.summary()
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])
    history = model.fit(x_train, y_train,
                        epochs=9,
                        batch_size=128,
                        validation_split=0.1)

    # 在测试集上评估模型
    score = model.evaluate(x_test, y_test, batch_size=128)
    print(f'Test loss: {score[0]}')
    print(f'Test accuracy: {score[1]}')

    model.save("reuters_model.keras")

    # # 选择一个测试样本进行预测
    # sample_index = 6
    # sample_newswire = x_test[sample_index]
    # true_label = test_labels[sample_index]
    #
    # # 进行预测
    # predictions = model.predict(np.expand_dims(sample_newswire, axis=0))  # 需要增加一个维度以匹配模型输入
    # predicted_label = np.argmax(predictions[0])  # 找到概率最大的类别索引
    #
    # print(f"新闻原文: {' '.join([reverse_word_index.get(_ - 3, '*') for _ in test_data[sample_index]])}")
    # print(f"真实类别: {true_label}")
    # print(f"预测类别: {predicted_label}")
    # print(f"预测是否正确: {'是' if true_label == predicted_label else '否'}")

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


def train_model_1():
    """早停法"""

    from tensorflow.keras.callbacks import EarlyStopping

    # 加载数据集（仅保留最常见的10000个单词，标签0=负面，1=正面）
    (train_data, train_labels), (test_data, test_labels) = keras.datasets.reuters.load_data(num_words=10000)

    # 显示数据集内容
    word_index = keras.datasets.reuters.get_word_index()
    reverse_word_index = dict([(value, key) for (key, value) in word_index.items()])
    text = ' '.join([reverse_word_index.get(_ - 3, "*") for _ in train_data[0]])

    print(f"训练样本数：{len(train_data)}，测试样本数：{len(test_data)}")
    print(f"第一个训练样本（单词索引序列）：{train_data[0][:10]}...")
    print(f"第一个训练样本的原始文本: {text}")
    print(f"第一个训练样本的形状: {len(train_data[0])}")
    print(f"第一个训练样本标签：{train_labels[0]}（对应某个主题类别）")
    print(f"总共有 {len(np.unique(train_labels))} 个类别")

    # 数据格式化
    vocab_size = 10000  # 设置词汇表大小
    num_classes = 46  # 总共有 46 个类别
    # 使用 Tokenizer 进行 one-hot 编码
    tokenizer = Tokenizer(num_words=vocab_size)
    x_train = tokenizer.sequences_to_matrix(train_data, mode='binary')
    x_test = tokenizer.sequences_to_matrix(test_data, mode='binary')
    y_train = to_categorical(train_labels, num_classes)
    y_test = to_categorical(test_labels, num_classes)

    # 模型设计
    model = Sequential()
    model.add(Dense(512, activation='relu', input_shape=(vocab_size,)))
    model.add(Dropout(0.5))  # Dropout 层用于防止过拟合，它会随机丢弃 50% 的神经元
    model.add(Dense(num_classes, activation='softmax'))

    # 定义早停回调函数
    early_stopping = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
    # monitor='val_loss': 监控验证损失
    # patience=3: 如果验证损失连续 3 轮没有改善，则停止训练
    # restore_best_weights=True: 恢复到训练过程中验证损失最低时的模型权重

    # 重新编译并训练模型
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    history = model.fit(x_train, y_train,
                        epochs=40,  # 可以设置一个更大的 epochs
                        batch_size=128,
                        validation_split=0.1,
                        callbacks=[early_stopping])  # 添加早停回调

    # 再次评估
    score = model.evaluate(x_test, y_test, batch_size=128)
    print(f'Optimized Test loss: {score[0]}')
    print(f'Optimized Test accuracy: {score[1]}')

    model.save("reuters_model_early_stop.keras")
    return history


if __name__ == "__main__":
    is_train_model = True
    is_show_model= True

    # if is_train_model and not is_show_model:
    #     history = train_model()
    if is_show_model and is_train_model:
        history = train_model()
        show_model(history)

        history = train_model_1()
        show_model(history)
```
