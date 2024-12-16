// 文件: FullyConnectedLayer.java
package com.example.java;

import java.util.Arrays;

import static com.example.java.SimpleCNNs.L2_REGULARIZATION;

/**
 * 全连接层实现，包含权重和偏置，使用Adam优化器。
 */
public class FullyConnectedLayer implements Layer {
    private int inputChannels;
    private int inputHeight;
    private int inputWidth;
    private int inputSize;
    private int outputSize;
    private double learningRate;
    private double[][] weights; // [outputSize][inputSize]
    private double[] biases; // [outputSize]
    private double[][] weightGradients;
    private double[] biasGradients;

    // Adam优化器参数
    private double[][] mWeights;
    private double[][] vWeights;
    private double[] mBias;
    private double[] vBias;
    private double beta1 = 0.9;
    private double beta2 = 0.999;
    private double epsilon = 1e-8;
    private int t = 0;

    // 缓存输入用于反向传播
    private double[][] inputCache;

    // 缓存输出用于后续层
    private double[][] outputCache;

    public FullyConnectedLayer(int inputChannels, int inputHeight, int inputWidth, int outputSize, double learningRate) {
        this.inputChannels = inputChannels;
        this.inputHeight = inputHeight;
        this.inputWidth = inputWidth;
        this.inputSize = inputChannels * inputHeight * inputWidth;
        this.outputSize = outputSize;
        this.learningRate = learningRate;
        initializeWeights();
        initializeAdam();
    }

    private void initializeWeights() {
        weights = new double[outputSize][inputSize];
        biases = new double[outputSize];
        double limit = Math.sqrt(6.0 / (inputSize + outputSize));
        for (int o = 0; o < outputSize; o++) {
            for (int i = 0; i < inputSize; i++) {
                weights[o][i] = (Math.random() * 2 * limit) - limit;
            }
            biases[o] = 0.0;
        }
    }

    private void initializeAdam() {
        mWeights = new double[outputSize][inputSize];
        vWeights = new double[outputSize][inputSize];
        mBias = new double[outputSize];
        vBias = new double[outputSize];
        for (int o = 0; o < outputSize; o++) {
            Arrays.fill(mWeights[o], 0.0);
            Arrays.fill(vWeights[o], 0.0);
            mBias[o] = 0.0;
            vBias[o] = 0.0;
        }
    }

    @Override
    public double[][][][] forward(double[][][][] input) {
        // 将输入展平成 [batchSize][inputSize]
        int batchSize = input.length;
        double[][] flatInput = new double[batchSize][inputSize];
        for (int b = 0; b < batchSize; b++) {
            int index = 0;
            for (int c = 0; c < input[0].length; c++) {
                for (int h = 0; h < input[0][0].length; h++) {
                    for (int w = 0; w < input[0][0][0].length; w++) {
                        flatInput[b][index++] = input[b][c][h][w];
                    }
                }
            }
        }

        this.inputCache = flatInput;
        double[][] output = new double[batchSize][outputSize];

        for (int b = 0; b < batchSize; b++) {
            for (int o = 0; o < outputSize; o++) {
                double sum = 0.0;
                for (int i = 0; i < inputSize; i++) {
                    sum += flatInput[b][i] * weights[o][i];
                }
                sum += biases[o];
                output[b][o] = sum;
            }
        }
        this.outputCache = output;

        // 将输出转换为 [batchSize][outputSize][1][1]
        double[][][][] output3D = new double[batchSize][outputSize][1][1];
        for (int b = 0; b < batchSize; b++) {
            for (int o = 0; o < outputSize; o++) {
                output3D[b][o][0][0] = output[b][o];
            }
        }
        return output3D;
    }

    @Override
    public double[][][][] backward(double[][][][] gradOutput, double learningRate) {
        // gradOutput 为 [batchSize][outputSize][1][1]
        int batchSize = gradOutput.length;
        double[][] gradOutputFlat = new double[batchSize][outputSize];
        for (int b = 0; b < batchSize; b++) {
            for (int o = 0; o < outputSize; o++) {
                gradOutputFlat[b][o] = gradOutput[b][o][0][0];
            }
        }

        // 计算梯度
        weightGradients = new double[outputSize][inputSize];
        biasGradients = new double[outputSize];
        double[][] gradInputFlat = new double[batchSize][inputSize];

        for (int b = 0; b < batchSize; b++) {
            for (int o = 0; o < outputSize; o++) {
                biasGradients[o] += gradOutputFlat[b][o];
                for (int i = 0; i < inputSize; i++) {
                    weightGradients[o][i] += inputCache[b][i] * gradOutputFlat[b][o];
                    gradInputFlat[b][i] += weights[o][i] * gradOutputFlat[b][o];
                }
            }
        }

        // 更新权重和偏置使用Adam优化器
        t += 1;
        for (int o = 0; o < outputSize; o++) {
            for (int i = 0; i < inputSize; i++) {
                // 更新第一和第二矩
                mWeights[o][i] = beta1 * mWeights[o][i] + (1 - beta1) * weightGradients[o][i];
                vWeights[o][i] = beta2 * vWeights[o][i] + (1 - beta2) * weightGradients[o][i] * weightGradients[o][i];

                // 计算偏差校正后的矩
                double mHat = mWeights[o][i] / (1 - Math.pow(beta1, t));
                double vHat = vWeights[o][i] / (1 - Math.pow(beta2, t));

                // 更新权重
                weights[o][i] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon) + learningRate * L2_REGULARIZATION * weights[o][i];
            }

            // 更新偏置
            mBias[o] = beta1 * mBias[o] + (1 - beta1) * biasGradients[o];
            vBias[o] = beta2 * vBias[o] + (1 - beta2) * biasGradients[o] * biasGradients[o];
            double mHatBias = mBias[o] / (1 - Math.pow(beta1, t));
            double vHatBias = vBias[o] / (1 - Math.pow(beta2, t));
            biases[o] -= learningRate * mHatBias / (Math.sqrt(vHatBias) + epsilon);
        }

        // 将 gradInputFlat 转换为 [batchSize][inputChannels][inputHeight][inputWidth]
        double[][][][] gradInput = new double[batchSize][inputChannels][inputHeight][inputWidth];
        for (int b = 0; b < batchSize; b++) {
            for (int i = 0; i < inputSize; i++) {
                int c = i / (inputHeight * inputWidth);
                int h = (i % (inputHeight * inputWidth)) / inputWidth;
                int w = (i % (inputHeight * inputWidth)) % inputWidth;
                gradInput[b][c][h][w] = gradInputFlat[b][i];
            }
        }
        return gradInput;
    }

    /**
     * 获取全连接层的输出缓存。
     *
     * @return 输出缓存
     */
    public double[][] getOutput() {
        return outputCache;
    }
}
