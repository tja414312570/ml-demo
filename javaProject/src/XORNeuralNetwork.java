import java.util.Random;

public class XORNeuralNetwork {
    // 权重和偏置
    double[][] inputToHiddenWeights; // 输入层到隐藏层的权重
    double[] hiddenBiases;           // 隐藏层的偏置
    double[] hiddenToOutputWeights;  // 隐藏层到输出层的权重
    double outputBias;               // 输出层的偏置

    double learningRate = 0.1; // 学习率

    // 构造函数初始化权重和偏置
    public XORNeuralNetwork() {
        Random rand = new Random();

        // 初始化权重和偏置，使用随机值
        inputToHiddenWeights = new double[2][2];
        inputToHiddenWeights[0][0] = rand.nextDouble(); inputToHiddenWeights[0][1] = rand.nextDouble();
        inputToHiddenWeights[1][0] = rand.nextDouble(); inputToHiddenWeights[1][1] = rand.nextDouble();

        hiddenBiases = new double[2];
        hiddenBiases[0] = rand.nextDouble();
        hiddenBiases[1] = rand.nextDouble();

        hiddenToOutputWeights = new double[2];
        hiddenToOutputWeights[0] = rand.nextDouble();
        hiddenToOutputWeights[1] = rand.nextDouble();

        outputBias = rand.nextDouble();
    }

    // Sigmoid激活函数
    public double sigmoid(double z) {
        return 1.0 / (1.0 + Math.exp(-z)); // sigmoid公式: 1 / (1 + e^(-z))
    }

    // Sigmoid的导数
    public double sigmoidDerivative(double z) {
        return z * (1.0 - z); // sigmoid导数公式: z * (1 - z)
    }

    // 前向传播
    public double forward(double input1, double input2) {
        // 隐藏层
        // 计算隐藏层第一个神经元的输入和输出
        double hiddenLayerInput1 = inputToHiddenWeights[0][0] * input1 + inputToHiddenWeights[1][0] * input2 + hiddenBiases[0]; // z_1 = W_1 * x_1 + W_2 * x_2 + b_1
        double hiddenLayerOutput1 = sigmoid(hiddenLayerInput1); // h_1 = sigmoid(z_1)

        // 计算隐藏层第二个神经元的输入和输出
        double hiddenLayerInput2 = inputToHiddenWeights[0][1] * input1 + inputToHiddenWeights[1][1] * input2 + hiddenBiases[1]; // z_2 = W_3 * x_1 + W_4 * x_2 + b_2
        double hiddenLayerOutput2 = sigmoid(hiddenLayerInput2); // h_2 = sigmoid(z_2)

        // 输出层
        // 计算输出层的输入和输出
        double outputLayerInput = hiddenToOutputWeights[0] * hiddenLayerOutput1 + hiddenToOutputWeights[1] * hiddenLayerOutput2 + outputBias; // z = W_5 * h_1 + W_6 * h_2 + b_output
        double predictedOutput = sigmoid(outputLayerInput); // y_hat = sigmoid(z)

        return predictedOutput;
    }

    // 反向传播
    public void backward(double input1, double input2, double actualOutput, double predictedOutput) {
        // 输出层误差
        double outputError = (predictedOutput - actualOutput) * sigmoidDerivative(predictedOutput); // delta_output = (y_hat - y) * sigmoid'(y_hat)

        // 隐藏层误差
        double hiddenLayerInput1 = inputToHiddenWeights[0][0] * input1 + inputToHiddenWeights[1][0] * input2 + hiddenBiases[0]; // 计算隐藏层第一个神经元的输入
        double hiddenLayerOutput1 = sigmoid(hiddenLayerInput1); // h_1 = sigmoid(z_1)
        double hiddenLayerError1 = outputError * hiddenToOutputWeights[0] * sigmoidDerivative(hiddenLayerOutput1); // delta_hidden_1 = delta_output * W_5 * sigmoid'(h_1)

        double hiddenLayerInput2 = inputToHiddenWeights[0][1] * input1 + inputToHiddenWeights[1][1] * input2 + hiddenBiases[1]; // 计算隐藏层第二个神经元的输入
        double hiddenLayerOutput2 = sigmoid(hiddenLayerInput2); // h_2 = sigmoid(z_2)
        double hiddenLayerError2 = outputError * hiddenToOutputWeights[1] * sigmoidDerivative(hiddenLayerOutput2); // delta_hidden_2 = delta_output * W_6 * sigmoid'(h_2)

        // 更新权重和偏置
        // 更新隐藏层到输出层的权重和偏置
        hiddenToOutputWeights[0] -= learningRate * outputError * hiddenLayerOutput1; // W_5 = W_5 - lr * delta_output * h_1
        hiddenToOutputWeights[1] -= learningRate * outputError * hiddenLayerOutput2; // W_6 = W_6 - lr * delta_output * h_2
        outputBias -= learningRate * outputError; // b_output = b_output - lr * delta_output

        // 更新输入层到隐藏层的权重和偏置
        inputToHiddenWeights[0][0] -= learningRate * hiddenLayerError1 * input1; // W_1 = W_1 - lr * delta_hidden_1 * x_1
        inputToHiddenWeights[1][0] -= learningRate * hiddenLayerError1 * input2; // W_2 = W_2 - lr * delta_hidden_1 * x_2
        inputToHiddenWeights[0][1] -= learningRate * hiddenLayerError2 * input1; // W_3 = W_3 - lr * delta_hidden_2 * x_1
        inputToHiddenWeights[1][1] -= learningRate * hiddenLayerError2 * input2; // W_4 = W_4 - lr * delta_hidden_2 * x_2
        hiddenBiases[0] -= learningRate * hiddenLayerError1; // b_1 = b_1 - lr * delta_hidden_1
        hiddenBiases[1] -= learningRate * hiddenLayerError2; // b_2 = b_2 - lr * delta_hidden_2
    }

    // 训练神经网络
    public void train(int epochs) {
        double[][] inputs = { {0, 0}, {0, 1}, {1, 0}, {1, 1} };
        double[] outputs = { 0, 1, 1, 0 };

        for (int epoch = 0; epoch < epochs; epoch++) {
            for (int i = 0; i < inputs.length; i++) {
                double input1 = inputs[i][0];
                double input2 = inputs[i][1];
                double actualOutput = outputs[i];

                // 前向传播
                double predictedOutput = forward(input1, input2);

                // 反向传播和更新权重
                backward(input1, input2, actualOutput, predictedOutput);
            }
        }
    }

    // 测试神经网络
    public void test() {
        double[][] inputs = { {0, 0}, {0, 1}, {1, 0}, {1, 1} };

        for (int i = 0; i < inputs.length; i++) {
            double input1 = inputs[i][0];
            double input2 = inputs[i][1];
            double predictedOutput = forward(input1, input2);
            System.out.println("Input: [" + input1 + ", " + input2 + "] => Output: " + predictedOutput);
        }
    }

    public static void main(String[] args) {
        XORNeuralNetwork nn = new XORNeuralNetwork();
        nn.train(1); // 训练10000次
        nn.test();       // 测试
    }
}
