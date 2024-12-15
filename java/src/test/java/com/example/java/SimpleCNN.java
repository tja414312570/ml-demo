package com.example.java;

import com.example.java.cnn.MnistLoader;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;

public class SimpleCNN {

    // 全连接层权重
    static double[] fcWeights;
    static double learningRate = 0.01;

    public static void trans(List<MnistLoader.MnistData> trainingData) {
            System.out.println("Loaded " + trainingData.size() + " training samples.");
            // 初始化全连接层权重
            // 假设池化后大小为13x13，展平为169
            int pooledSize = 13 * 13;
            fcWeights = new double[pooledSize];
            for (int i = 0; i < fcWeights.length; i++) {
                fcWeights[i] = Math.random() - 0.5;
            }

            // 训练循环（简化为一个epoch）
            for (MnistLoader.MnistData sample : trainingData) {
                double[][] input = sample.pixels();
                int label = sample.label();

                // 前向传播
                double[][] conv = convolve(input, getSobelKernel());
                double[][] activated = relu(conv);
                double[][] pooled = maxPool(activated, 2);
                double[] flat = flatten(pooled);
                double fcOutput = fullyConnected(flat, fcWeights);

                // 计算损失（假设使用简单的平方损失）
                double target = (label > 4) ? 1.0 : 0.0; // 简单二分类：标签>4为1，否则为0
                double loss = Math.pow(fcOutput - target, 2);

                // 反向传播（计算fcWeights梯度）
                double dLoss_dOutput = 2 * (fcOutput - target);
                for (int i = 0; i < fcWeights.length; i++) {
                    double dOutput_dWeight = flat[i];
                    fcWeights[i] -= learningRate * dLoss_dOutput * dOutput_dWeight;
                }

                // 在实际应用中，还需反向传播到卷积层和其他层，这里省略
            }

            // 测试一个样本
            MnistLoader.MnistData testSample = trainingData.getFirst();
            double[][] input = testSample.pixels();
            int label = testSample.label();

            double[][] conv = convolve(input, getSobelKernel());
            double[][] activated = relu(conv);
            double[][] pooled = maxPool(activated, 2);
            double[] flat = flatten(pooled);
            double fcOutput = fullyConnected(flat, fcWeights);

            int predictedLabel = fcOutput > 0.5 ? 1 : 0;
            System.out.println("测试样本预测标签: " + predictedLabel);
            System.out.println("真实标签: " + label);

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
        return new double[][] {
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
