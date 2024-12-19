package com.example.java;

import com.example.java.cnn.MnistLoader;
import com.example.java.cnn.callbacks.TestingCallback;
import com.example.java.cnn.callbacks.TrainingCallback;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.Arrays;
import java.util.List;

@Data
@Slf4j
public class SimpleCNN {

    // 全连接层权重
    private double[][] fcWeights; // [numClasses][inputSize]
    private static final int NUM_CLASSES = 10; // MNIST有10个类别

    // 模型文件路径
    private final String modelFilePath = "fcWeights.model";

    // 回调列表
    private TrainingCallback trainingCallbacks ;
    private TestingCallback testingCallbacks;

    // 初始化权重（使用 Xavier 初始化）
    public void initializeWeights(int inputSize) {
        fcWeights = new double[NUM_CLASSES][inputSize];
        double limit = Math.sqrt(6.0 / (inputSize + NUM_CLASSES)); // Xavier初始化
        for (int c = 0; c < NUM_CLASSES; c++) {
            for (int i = 0; i < inputSize; i++) {
                fcWeights[c][i] = (Math.random() * 2 * limit) - limit;
            }
        }
        log.info("Initialized fully connected layer weights with Xavier initialization.");
    }

    // Softmax 激活函数
    public static double[] softmax(double[] logits) {
        double max = Double.NEGATIVE_INFINITY;
        for (double logit : logits) {
            if (logit > max) {
                max = logit;
            }
        }

        double sum = 0.0;
        double[] exp = new double[logits.length];
        for (int i = 0; i < logits.length; i++) {
            exp[i] = Math.exp(logits[i] - max); // 防止溢出
            sum += exp[i];
        }

        double[] probabilities = new double[logits.length];
        for (int i = 0; i < logits.length; i++) {
            probabilities[i] = exp[i] / sum;
        }
        return probabilities;
    }

    // 前向传播方法，返回每个类别的输出概率
    public double[] forward(double[] input) {
        double[] logits = new double[NUM_CLASSES];
        for (int c = 0; c < NUM_CLASSES; c++) {
            double sum = 0;
            for (int i = 0; i < input.length; i++) {
                sum += input[i] * fcWeights[c][i];
            }
            logits[c] = sum;
        }
        return softmax(logits);
    }

    // 训练方法
    public void train(List<MnistLoader.MnistData> trainingData, int epochs) {
        if (fcWeights == null) {
            // 假设池化后大小为13x13，展平为169
            int pooledSize = 13 * 13;
            initializeWeights(pooledSize);
        }

        // 验证并记录部分输入数据
        if (!trainingData.isEmpty()) {
            MnistLoader.MnistData sample = trainingData.get(0);
            log.debug("Sample label: {}", sample.label());
            log.debug("Sample pixels: {}", Arrays.deepToString(sample.pixels()));
        }

        for (int epoch = 1; epoch <= epochs; epoch++) {
            // 回调：训练开始
            int finalEpoch = epoch;
            trainingCallbacks.onEpochStart(finalEpoch, epochs);

            double totalLoss = 0;
            int validSamples = 0; // 计算有效样本数量

            for (MnistLoader.MnistData sample : trainingData) {
                double[][] inputMatrix = sample.pixels();
                int label = sample.label();

                // 前向传播
                double[][] conv = convolve(inputMatrix, getSobelKernel());
                double[][] activated = relu(conv);
                double[][] pooled = maxPool(activated, 2);
                double[] flat = flatten(pooled);
                double[] probabilities = forward(flat);
                log.debug("Probabilities: {}", Arrays.toString(probabilities));

                // 计算交叉熵损失
                double loss = -Math.log(probabilities[label] + 1e-15); // 添加小常数防止log(0)
                log.debug("loss: {}", loss);

                // 检查 loss 是否为 NaN 或 Infinity
                if (Double.isNaN(loss) || Double.isInfinite(loss)) {
                    log.error("Loss is NaN or Infinite for sample with label {}. Skipping weight update.", label);
                    continue; // 跳过权重更新和累加损失
                }

                totalLoss += loss;
                validSamples++;

                // 反向传播（计算梯度并更新权重）
                // Gradient of loss w.r.t logits
                double[] dLoss_dLogits = new double[NUM_CLASSES];
                for (int c = 0; c < NUM_CLASSES; c++) {
                    dLoss_dLogits[c] = probabilities[c];
                }
                dLoss_dLogits[label] -= 1.0; // 对于正确类别

                // 更新权重
                double learningRate = 0.001;
                for (int c = 0; c < NUM_CLASSES; c++) {
                    for (int i = 0; i < flat.length; i++) {
                        fcWeights[c][i] -= learningRate * dLoss_dLogits[c] * flat[i];
                    }
                }
            }

            // 计算平均损失
            double averageLoss = (validSamples > 0) ? (totalLoss / validSamples) : Double.NaN;
            log.info("Epoch {}/{} - Average Loss: {}", epoch, epochs,
                    (Double.isNaN(averageLoss) ? "NaN" : String.format("%.4f", averageLoss)));

            // 训练结束后，记录权重的统计信息
            double sumWeights = 0;
            double sumSquares = 0;
            for (int c = 0; c < NUM_CLASSES; c++) {
                for (double weight : fcWeights[c]) {
                    sumWeights += weight;
                    sumSquares += weight * weight;
                }
            }
            double mean = sumWeights / (fcWeights.length * fcWeights[0].length);
            double variance = (sumSquares / (fcWeights.length * fcWeights[0].length)) - (mean * mean);
            double stdDev = Math.sqrt(variance);
            log.debug("Weights Mean: {}, StdDev: {}", mean, stdDev);

            // 回调：训练结束
            int finalEpoch1 = epoch;
            trainingCallbacks.onEpochEnd(finalEpoch1, averageLoss);
        }
    }

    // 测试方法，返回准确率
    public double test(List<MnistLoader.MnistData> testData) {
        int correct = 0;
        int total = testData.size();

        // 回调：测试开始
        testingCallbacks.onTestStart(total);

        int currentTest = 0;
        for (MnistLoader.MnistData sample : testData) {
            currentTest++;
            double[][] inputMatrix = sample.pixels();
            int label = sample.label();

            double[][] conv = convolve(inputMatrix, getSobelKernel());
            double[][] activated = relu(conv);
            double[][] pooled = maxPool(activated, 2);
            double[] flat = flatten(pooled);
            double[] probabilities = forward(flat);
            log.debug("Probabilities (test): {}", Arrays.toString(probabilities));

            // 预测标签为概率最高的类别
            int predictedLabel = 0;
            double maxProb = probabilities[0];
            for (int c = 1; c < NUM_CLASSES; c++) {
                if (probabilities[c] > maxProb) {
                    maxProb = probabilities[c];
                    predictedLabel = c;
                }
            }

            if (predictedLabel == label) {
                correct++;
            }
            // 回调：测试进度
            int finalCurrentTest = currentTest;
            int finalPredictedLabel = predictedLabel;
            testingCallbacks.onTestProgress(finalCurrentTest, total,sample, finalPredictedLabel);
        }
        double accuracy = (double) correct / testData.size();
        log.info("Test Accuracy: {}", String.format("%.2f%% (%d / %d)", accuracy * 100, correct, testData.size()));

        // 回调：测试结束
        testingCallbacks.onTestEnd(accuracy);

        return accuracy;
    }

    // 保存模型权重到文件
    public void saveModel() throws IOException {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(modelFilePath))) {
            oos.writeObject(fcWeights);
            log.info("模型已保存到 {}", modelFilePath);
        }
    }

    // 从文件加载模型权重
    public void loadModel() throws IOException, ClassNotFoundException {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(modelFilePath))) {
            fcWeights = (double[][]) ois.readObject();
            log.info("模型已从 {} 加载", modelFilePath);
        }
    }

    // 卷积操作
    public static double[][] convolve(double[][] input, double[][] kernel) {
        int inputSize = input.length;
        int kernelSize = kernel.length;
        int outputSize = inputSize - kernelSize + 1;
        double[][] output = new double[outputSize][outputSize];

        for (int i = 0; i < outputSize; i++) {
            for (int j = 0; j < outputSize; j++) {
                double sum = 0;
                for (int ki = 0; ki < kernelSize; ki++) {
                    for (int kj = 0; kj < kernelSize; kj++) {
                        sum += input[i + ki][j + kj] * kernel[ki][kj];
                    }
                }
                output[i][j] = sum;
            }
        }
        return output;
    }

    // ReLU 激活函数
    public static double[][] relu(double[][] input) {
        int rows = input.length;
        int cols = input[0].length;
        double[][] output = new double[rows][cols];

        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                output[i][j] = Math.max(0, input[i][j]);
            }
        }
        return output;
    }

    // 最大池化操作
    public static double[][] maxPool(double[][] input, int poolSize) {
        int inputSize = input.length;
        int outputSize = inputSize / poolSize;
        double[][] output = new double[outputSize][outputSize];

        for (int i = 0; i < outputSize; i++) {
            for (int j = 0; j < outputSize; j++) {
                double max = Double.NEGATIVE_INFINITY;
                for (int pi = 0; pi < poolSize; pi++) {
                    for (int pj = 0; pj < poolSize; pj++) {
                        int currentI = i * poolSize + pi;
                        int currentJ = j * poolSize + pj;
                        if (currentI < input.length && currentJ < input[0].length) {
                            if (input[currentI][currentJ] > max) {
                                max = input[currentI][currentJ];
                            }
                        }
                    }
                }
                output[i][j] = max;
            }
        }
        return output;
    }

    // 展平矩阵为向量
    public static double[] flatten(double[][] input) {
        int rows = input.length;
        int cols = input[0].length;
        double[] flat = new double[rows * cols];
        int index = 0;
        for (double[] row : input) {
            for (double val : row) {
                flat[index++] = val;
            }
        }
        return flat;
    }

    // 获取Sobel卷积核（水平边缘检测）
    public static double[][] getSobelKernel() {
        return new double[][]{
                {1, 0, -1},
                {2, 0, -2},
                {1, 0, -1}
        };
    }
}
