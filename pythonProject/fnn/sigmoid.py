import numpy as np
import matplotlib.pyplot as plt

# 定义sigmoid函数
def sigmoid(x):
    """Sigmoid 激活函数，将输入映射到 (0, 1) 之间"""
    return 1 / (1 + np.exp(-x))

# 定义sigmoid导数函数
def sigmoid_derivative(x):
    return x * (1 - x)

# 创建x的值范围
x_values = np.linspace(-10, 10, 400)

# 计算y值
y_sigmoid = sigmoid(x_values)
y_sigmoid_derivative = sigmoid_derivative(y_sigmoid)

# 绘制sigmoid函数图形
plt.plot(x_values, y_sigmoid, label="Sigmoid", color="blue")

# 绘制sigmoid导数函数图形
plt.plot(x_values, y_sigmoid_derivative, label="Sigmoid Derivative", color="red")

# 添加标题和标签
plt.title("Sigmoid and Sigmoid Derivative Functions")
plt.xlabel("x")
plt.ylabel("Value")
plt.grid(True)
plt.legend()

# 显示图形
plt.show()
