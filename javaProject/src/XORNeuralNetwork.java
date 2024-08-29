import java.util.Random;

public class XORNeuralNetwork {
    // 权重和偏置
    double[][] W1; // 输入层到隐藏层的权重
    double[] b1;   // 隐藏层的偏置
    double[] W2;   // 隐藏层到输出层的权重
    double b2;     // 输出层的偏置

    double learningRate = 0.1; // 学习率

    // 构造函数初始化权重和偏置
    public XORNeuralNetwork() {
        Random rand = new Random();

        // 初始化权重和偏置，使用随机值
        W1 = new double[2][2];
        W1[0][0] = rand.nextDouble(); W1[0][1] = rand.nextDouble();
        W1[1][0] = rand.nextDouble(); W1[1][1] = rand.nextDouble();

        b1 = new double[2];
        b1[0] = rand.nextDouble();
        b1[1] = rand.nextDouble();

        W2 = new double[2];
        W2[0] = rand.nextDouble();
        W2[1] = rand.nextDouble();

        b2 = rand.nextDouble();
    }

    // Sigmoid激活函数
    public double sigmoid(double z) {
        return 1.0 / (1.0 + Math.exp(-z));
    }

    // Sigmoid的导数
    public double sigmoidDerivative(double z) {
        return z * (1.0 - z);
    }

    // 前向传播
    public double forward(double x1, double x2) {
        // 隐藏层
        double z1_1 = W1[0][0] * x1 + W1[1][0] * x2 + b1[0];
        double h1_1 = sigmoid(z1_1);

        double z1_2 = W1[0][1] * x1 + W1[1][1] * x2 + b1[1];
        double h1_2 = sigmoid(z1_2);

        // 输出层
        double z2 = W2[0] * h1_1 + W2[1] * h1_2 + b2;
        double y_hat = sigmoid(z2);

        return y_hat;
    }

    // 反向传播
    public void backward(double x1, double x2, double y, double y_hat) {
        // 输出层误差
        double delta2 = (y_hat - y) * sigmoidDerivative(y_hat);

        // 隐藏层误差
        double z1_1 = W1[0][0] * x1 + W1[1][0] * x2 + b1[0];
        double h1_1 = sigmoid(z1_1);
        double delta1_1 = delta2 * W2[0] * sigmoidDerivative(h1_1);

        double z1_2 = W1[0][1] * x1 + W1[1][1] * x2 + b1[1];
        double h1_2 = sigmoid(z1_2);
        double delta1_2 = delta2 * W2[1] * sigmoidDerivative(h1_2);

        // 更新权重和偏置
        W2[0] -= learningRate * delta2 * h1_1;
        W2[1] -= learningRate * delta2 * h1_2;
        b2 -= learningRate * delta2;

        W1[0][0] -= learningRate * delta1_1 * x1;
        W1[1][0] -= learningRate * delta1_1 * x2;
        W1[0][1] -= learningRate * delta1_2 * x1;
        W1[1][1] -= learningRate * delta1_2 * x2;
        b1[0] -= learningRate * delta1_1;
        b1[1] -= learningRate * delta1_2;
    }

    // 训练神经网络
    public void train(int epochs) {
        double[][] inputs = { {0, 0}, {0, 1}, {1, 0}, {1, 1} };
        double[] outputs = { 0, 1, 1, 0 };

        for (int epoch = 0; epoch < epochs; epoch++) {
            for (int i = 0; i < inputs.length; i++) {
                double x1 = inputs[i][0];
                double x2 = inputs[i][1];
                double y = outputs[i];

                // 前向传播
                double y_hat = forward(x1, x2);

                // 反向传播和更新权重
                backward(x1, x2, y, y_hat);
            }
        }
    }

    // 测试神经网络
    public void test() {
        double[][] inputs = { {0, 0}, {0, 1}, {1, 0}, {1, 1} };

        for (int i = 0; i < inputs.length; i++) {
            double x1 = inputs[i][0];
            double x2 = inputs[i][1];
            double y_hat = forward(x1, x2);
            System.out.println("Input: [" + x1 + ", " + x2 + "] => Output: " + y_hat);
        }
    }

    public static void main(String[] args) {
        XORNeuralNetwork nn = new XORNeuralNetwork();
        nn.train(100000); // 训练10000次
        nn.test();       // 测试
    }
}
