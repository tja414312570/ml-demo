package com.example.java;

import com.example.java.cnn.MnistLoader;
import com.example.java.callbacks.TestingCallback;
import com.example.java.callbacks.TrainingCallback;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class SimpleCNN {

    // 全连接层权重
    private double[] fcWeights;
    private final double learningRate = 0.001; // 降低学习率

    // 模型文件路径
    private final String modelFilePath = "fcWeights.model";

    // 回调列表
    private final List<TrainingCallback> trainingCallbacks = new ArrayList<>();
    private final List<TestingCallback> testingCallbacks = new ArrayList<>();

    // 方法用于注册训练回调
    public void addTrainingCallback(TrainingCallback callback) {
        trainingCallbacks.add(callback);
    }

    // 方法用于注册测试回调
    public void addTestingCallback(TestingCallback callback) {
        testingCallbacks.add(callback);
    }

    // 初始化权重（使用 Xavier 初始化）
    public void initializeWeights(int inputSize) {
        fcWeights = new double[inputSize];
        double limit = Math.sqrt(6.0 / (inputSize + 1)); // 假设输出大小为1
        for (int i = 0; i < fcWeights.length; i++) {
            fcWeights[i] = (Math.random() * 2 * limit) - limit;
        }
        log.info("Initialized fully connected layer weights with Xavier initialization.");
    }

    // Sigmoid 激活函数
    public static double sigmoid(double x) {
        return 1.0 / (1.0 + Math.exp(-x));
    }

    // 训练方法
    public void train(List<MnistLoader.MnistData> trainingData, int epochs) {
        if (fcWeights == null) {
            // 假设池化后大小为13x13，展平为169
            int pooledSize = 13 * 13;
            initializeWeights(pooledSize);
        }

        for (int epoch = 1; epoch <= epochs; epoch++) {
            // 回调：训练开始
            int finalEpoch = epoch;
            trainingCallbacks.forEach(callback -> callback.onEpochStart(finalEpoch, epochs));

            double totalLoss = 0;
            for (MnistLoader.MnistData sample : trainingData) {
                double[][] input = sample.pixels();
                int label = sample.label();

                // 前向传播
                double[][] conv = convolve(input, getSobelKernel());
                double[][] activated = relu(conv);
                double[][] pooled = maxPool(activated, 2);
                double[] flat = flatten(pooled);
                double fcOutputRaw = fullyConnected(flat, fcWeights);
                log.debug("fcOutputRaw: {}", fcOutputRaw);

                double fcOutput = sigmoid(fcOutputRaw);
                log.debug("fcOutput (after sigmoid): {}", fcOutput);

                // 计算损失（平方损失）
                double target = (label > 4) ? 1.0 : 0.0; // 简单二分类
                double loss = Math.pow(fcOutput - target, 2);
                log.debug("loss: {}", loss);

                // 检查 loss 是否为 NaN 或 Infinity
                if (Double.isNaN(loss) || Double.isInfinite(loss)) {
                    log.error("Loss is NaN or Infinite for sample with label {}. Skipping weight update.", label);
                    continue; // 跳过权重更新和累加损失
                }

                totalLoss += loss;

                // 反向传播（更新全连接层权重）
                double dLoss_dOutput = 2 * (fcOutput - target);
                log.debug("dLoss_dOutput: {}", dLoss_dOutput);

                // 检查 dLoss_dOutput 是否为 NaN 或 Infinity
                if (Double.isNaN(dLoss_dOutput) || Double.isInfinite(dLoss_dOutput)) {
                    log.error("dLoss_dOutput is NaN or Infinite. Skipping weight update.");
                    continue; // 跳过权重更新
                }

                for (int i = 0; i < fcWeights.length; i++) {
                    double dOutput_dWeight = flat[i];
                    fcWeights[i] -= learningRate * dLoss_dOutput * dOutput_dWeight;
                }
            }
            double averageLoss = totalLoss / trainingData.size();
            log.info("Epoch {}/{} - Average Loss: {}", epoch, epochs, String.format("%.4f", averageLoss));

            // 回调：训练结束
            int finalEpoch1 = epoch;
            trainingCallbacks.forEach(callback -> callback.onEpochEnd(finalEpoch1, averageLoss));
        }
    }

    // 测试方法，返回准确率
    public double test(List<MnistLoader.MnistData> testData) {
        int correct = 0;
        int total = testData.size();

        // 回调：测试开始
        testingCallbacks.forEach(callback -> callback.onTestStart(total));

        int currentTest = 0;
        for (MnistLoader.MnistData sample : testData) {
            currentTest++;
            double[][] input = sample.pixels();
            int label = sample.label();

            double[][] conv = convolve(input, getSobelKernel());
            double[][] activated = relu(conv);
            double[][] pooled = maxPool(activated, 2);
            double[] flat = flatten(pooled);
            double fcOutputRaw = fullyConnected(flat, fcWeights);
            log.debug("fcOutputRaw (test): {}", fcOutputRaw);

            double fcOutput = sigmoid(fcOutputRaw);
            log.debug("fcOutput (after sigmoid, test): {}", fcOutput);

            // 检查 fcOutput 是否为 NaN 或 Infinity
            if (Double.isNaN(fcOutput) || Double.isInfinite(fcOutput)) {
                log.error("fcOutput is NaN or Infinite during testing. Skipping this sample.");
                continue; // 跳过这个样本，防止污染准确率
            }

            int predictedLabel = fcOutput > 0.5 ? 1 : 0;
            int targetLabel = label > 4 ? 1 : 0;
            if (predictedLabel == targetLabel) {
                correct++;
            }

            // 回调：测试进度
            int finalCurrentTest = currentTest;
            testingCallbacks.forEach(callback -> callback.onTestProgress(finalCurrentTest, total));
        }
        double accuracy = (double) correct / testData.size();
        log.info("Test Accuracy: {}", String.format("%.2f%% (%d / %d)", accuracy * 100, correct, testData.size()));

        // 回调：测试结束
        testingCallbacks.forEach(callback -> callback.onTestEnd(accuracy));

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
            fcWeights = (double[]) ois.readObject();
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

    // 全连接层
    public static double fullyConnected(double[] input, double[] weights) {
        double sum = 0;
        for (int i = 0; i < input.length; i++) {
            sum += input[i] * weights[i];
        }
        // 假设没有偏置
        return sum;
    }

    // 获取Sobel卷积核
    public static double[][] getSobelKernel() {
        return new double[][]{
                {1, 0, -1},
                {2, 0, -2},
                {1, 0, -1}
        };
    }

    // 打印矩阵
    public static void printMatrix(double[][] matrix) {
        for (double[] row : matrix) {
            for (double val : row) {
                System.out.printf("%.2f\t", val);
            }
            System.out.println();
        }
        System.out.println();
    }

    // 打印向量
    public static void printVector(double[] vector) {
        for (double val : vector) {
            System.out.printf("%.2f\t", val);
        }
        System.out.println("\n");
    }
}
