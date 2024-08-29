import numpy as np
import matplotlib.pyplot as plt


# 定义激活函数及其导数
def sigmoid(x):
    """Sigmoid 激活函数，将输入映射到 (0, 1) 之间"""
    return 1 / (1 + np.exp(-x))


def sigmoid_derivative(x):
    """Sigmoid 函数的导数，用于计算反向传播中的梯度"""
    return x * (1 - x)


# 前馈神经网络类
class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # 初始化权重和偏置，随机小值初始化
        self.weights_input_hidden = np.random.randn(input_size, hidden_size)
        self.weights_hidden_output = np.random.randn(hidden_size, output_size)
        self.bias_hidden = np.random.randn(hidden_size)
        self.bias_output = np.random.randn(output_size)

        # 保存误差历史记录，便于绘制误差曲线
        self.error_history = []

    def feedforward(self, X):
        """前向传播：从输入层 -> 隐藏层 -> 输出层"""
        # 输入层到隐藏层的线性组合
        self.hidden_input = np.dot(X, self.weights_input_hidden) + self.bias_hidden
        # 隐藏层输出，通过激活函数处理
        self.hidden_output = sigmoid(self.hidden_input)

        # 隐藏层到输出层的线性组合
        self.final_input = np.dot(self.hidden_output, self.weights_hidden_output) + self.bias_output
        # 最终输出
        self.final_output = sigmoid(self.final_input)

        return self.final_output

    def backpropagation(self, X, y, learning_rate):
        """反向传播：根据误差调整权重和偏置"""
        # 前向传播获取输出
        output = self.feedforward(X)

        # 计算输出层误差
        error = y - output
        self.error_history.append(np.mean(np.abs(error)))  # 记录误差

        # 计算输出层到隐藏层的梯度
        d_output = error * sigmoid_derivative(output)

        # 计算隐藏层误差
        error_hidden = d_output.dot(self.weights_hidden_output.T)
        d_hidden = error_hidden * sigmoid_derivative(self.hidden_output)

        # 更新权重和偏置
        self.weights_hidden_output += self.hidden_output.T.dot(d_output) * learning_rate
        self.weights_input_hidden += X.T.dot(d_hidden) * learning_rate
        self.bias_output += np.sum(d_output, axis=0) * learning_rate
        self.bias_hidden += np.sum(d_hidden, axis=0) * learning_rate

    def train(self, X, y, epochs, learning_rate):
        """训练神经网络：通过多次迭代优化权重和偏置"""
        for epoch in range(epochs):
            self.backpropagation(X, y, learning_rate)
            # 可视化训练过程中的误差
            if epoch % 1000 == 0:
                print(f'Epoch {epoch}, Error: {self.error_history[-1]}')

    def plot_error_history(self):
        """绘制误差变化曲线"""
        plt.figure(figsize=(10, 5))
        plt.plot(self.error_history)
        plt.title('Error History')
        plt.xlabel('Epoch')
        plt.ylabel('Mean Absolute Error')
        plt.show()

    def plot_layer_outputs(self, X):
        """可视化输入、隐藏层输出和最终输出"""
        output = self.feedforward(X)

        plt.figure(figsize=(15, 5))

        # 输入层
        plt.subplot(1, 3, 1)
        plt.title("Input Layer")
        plt.imshow(X, cmap='viridis', aspect='auto')
        plt.colorbar()

        # 隐藏层
        plt.subplot(1, 3, 2)
        plt.title("Hidden Layer Output")
        plt.imshow(self.hidden_output, cmap='viridis', aspect='auto')
        plt.colorbar()

        # 输出层
        plt.subplot(1, 3, 3)
        plt.title("Output Layer")
        plt.imshow(output, cmap='viridis', aspect='auto')
        plt.colorbar()

        plt.show()


# 使用神经网络进行训练和预测
if __name__ == "__main__":
    # 创建输入数据 (XOR 问题)
    X = np.array([[0, 0],
                  [0, 1],
                  [1, 0],
                  [1, 1]])

    # 期望输出
    y = np.array([[0],
                  [0],
                  [0],
                  [1]])

    # 初始化神经网络
    nn = NeuralNetwork(input_size=2, hidden_size=5, output_size=1)

    # 训练神经网络
    nn.train(X, y, epochs=10000, learning_rate=0.1)

    # 绘制训练过程中误差的变化
    nn.plot_error_history()

    # 绘制前向传播过程中各层的输出
    nn.plot_layer_outputs(X)

    # 输出训练后的最终结果
    print("训练后的输出:")
    print(nn.feedforward(X))
    # 使用新数据进行测试
    test_data = np.array([[0, 0],
                          [1, 1],
                          [1, 0],
                          [0, 1]])

    # 预测输出
    predictions = nn.feedforward(test_data)
    print("测试数据的预测结果:")
    print(predictions)