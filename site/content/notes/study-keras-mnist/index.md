---
title: 手写数字识别
slug: study-keras-mnist
content_id: study-db0e06d6f92710461a7c9e31
date: '2025-11-13T19:37:08+08:00'
draft: false
author: firlight
lastmod: '2025-11-13T19:37:08+08:00'
series:
- python深度学习
---

```python
# -*- author: zrk

# 利用keras框架、mnist数据集进行手写数字识别任务的练习
# 实现的内容包括：
#   环境验证、模型训练、训练可视化、模型验证


import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
import sys
import numpy as np
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import Button, Label, Frame


class SimplePixelRecognizer:
    def __init__(self, root, model):
        self.root = root
        self.root.title("简易像素手写识别")
        self.model = model

        # 核心参数
        self.grid_size = 28  # 28x28像素
        self.cell_size = 15  # 每个像素的显示大小
        self.pixel_data = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)  # 0=白，1=黑

        # 绘制状态：是否按住鼠标左键
        self.drawing = False

        self.create_ui()

    def create_ui(self):
        # 1. 像素网格
        self.grid_frame = Frame(self.root, borderwidth=2, relief="solid")
        self.grid_frame.pack(padx=10, pady=10)

        # 创建28x28的像素按钮
        self.pixel_buttons = []
        for i in range(self.grid_size):
            row_buttons = []
            for j in range(self.grid_size):
                btn = Button(
                    self.grid_frame,
                    width=2,
                    height=1,
                    bg="white",
                    borderwidth=1,
                    highlightthickness=0  # 去除按钮边框高亮
                )
                btn.grid(row=i, column=j, padx=0, pady=0)

                # 绑定鼠标事件（核心逻辑）
                btn.bind("<ButtonPress-1>", lambda e, x=i, y=j: self.start_draw(x, y))  # 按下左键
                btn.bind("<Motion>", lambda e, x=i, y=j: self.draw_pixel(x, y))  # 鼠标移动
                # btn.bind("<ButtonRelease-1>", lambda e: self.stop_draw())  # 松开左键

                row_buttons.append(btn)
            self.pixel_buttons.append(row_buttons)

        # 2. 控制按钮
        self.ctrl_frame = Frame(self.root)
        self.ctrl_frame.pack(padx=10, pady=5)


        self.clear_btn = Button(
            self.ctrl_frame,
            text="清空重写",
            font=('SimHei', 12),
            width=10,
            command=self.clear_all
        )
        self.clear_btn.grid(row=0, column=0, padx=5)

        self.predict_btn = Button(
            self.ctrl_frame,
            text="识别数字",
            font=('SimHei', 12),
            width=10,
            command=self.predict
        )
        self.predict_btn.grid(row=2, column=0, padx=5)

        self.inf_btn = Button(
            self.ctrl_frame,
            text="点击左键开始书写，再次左键取消书写，拖动以书写",
            font=('SimHei', 12),
            width=10,
            command=None
        )
        self.clear_btn.grid(row=3, column=0, padx=5)

        # 3. 结果显示
        self.result_label = Label(
            self.root,
            text="点击左键开始书写，再次左键取消书写，拖动以书写",
            font=('SimHei', 12),
            wraplength=400
        )
        self.result_label.pack(padx=10, pady=10)

    # 绘制相关函数（核心简化逻辑）
    def start_draw(self, x, y):
        """开始绘制（按住左键时）"""
        self.drawing = not self.drawing
        # self.turn_on_pixel(x, y)  # 点亮当前像素

    def draw_pixel(self, x, y):
        """鼠标移动时绘制（仅当按住左键时）"""
        if self.drawing:  # 只有按住左键时才点亮像素
            self.turn_on_pixel(x, y)


    def turn_on_pixel(self, x, y):
        """点亮单个像素（设为黑色）"""
        if self.pixel_data[x, y] == 0:  # 只在未点亮时操作
            self.pixel_data[x, y] = 1.0
            self.pixel_buttons[x][y].config(bg="black")

    # 辅助功能
    def clear_all(self):
        """清空所有像素"""
        self.pixel_data = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                self.pixel_buttons[i][j].config(bg="white")
        self.result_label.config(text="按住鼠标左键滑过像素格绘制数字，点击识别")

    def predict(self):
        """识别当前绘制的数字"""
        input_data = self.pixel_data.reshape(1, 28 * 28)
        pred = self.model.predict(input_data)
        digit = np.argmax(pred)
        confidence = pred[0][digit] * 100
        self.result_label.config(text=f"预测结果：{digit}，置信度：{confidence:.1f}%")


def train_model():
    # 数据加载（MNIST数据集）
    (train_images, train_labels), (test_images, test_labels) = keras.datasets.mnist.load_data()

    train_images = train_images.reshape((60000, 28 * 28)).astype('float32') / 255
    test_images = test_images.reshape((10000, 28 * 28)).astype('float32') / 255
    train_labels = tf.keras.utils.to_categorical(train_labels)
    test_labels = tf.keras.utils.to_categorical(test_labels)

    network = models.Sequential()
    network.add(layers.Dense(512, activation='relu', input_shape=(28 * 28,)))
    network.add(layers.Dense(10, activation='softmax'))

    network.compile(optimizer='rmsprop', loss='categorical_crossentropy', metrics=['accuracy'])

    history = network.fit(train_images, train_labels, epochs=6, batch_size=60, validation_split=0.1)

    test_loss, test_acc = network.evaluate(test_images, test_labels)
    print(f"模型测试准确率: {test_acc:.4f}")

    network.save('mnist_model.keras')

    return history

def show_model(history):
    plt.rcParams["font.family"] = ["SimHei"]
    plt.rcParams["axes.unicode_minus"] = False

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

def test_model():
    try:
        model = tf.keras.models.load_model('mnist_model.keras')
    except Exception as e:
        print("model loading error.")
        # raise e
    root = tk.Tk()
    app = SimplePixelRecognizer(root, model)
    root.mainloop()

if __name__ == "__main__":
    env_test = False
    model_train = False
    model_show = False
    model_test = False

    if env_test:
        print("Python版本:", sys.version)
        print("TensorFlow版本:", tf.__version__)
        print("Keras版本:", keras.__version__)

    if model_train and not model_show:
        history = train_model()

    if model_show and model_train:
        history = train_model()
        show_model(history)

    if model_test:
        test_model()
```
