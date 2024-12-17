// 文件: ConvolutionLayer.java
package com.example.java.cnn;

import java.util.Arrays;

import static com.example.java.cnn.SimpleCNNs.L2_REGULARIZATION;

/**
 * 卷积层实现，支持多输入通道和多输出通道。
 */
public class ConvolutionLayer implements Layer {
    private int inputChannels;
    private int outputChannels;
    private int kernelSize;
    private double learningRate;
    private double[][][][] weights; // [outputChannels][inputChannels][kernelSize][kernelSize]
    private double[][][][] weightGradients;
    private double[] biases;
    private double[] biasGradients;

    // Adam优化器参数
    private double[][][][] mWeights;
    private double[][][][] vWeights;
    private double[] mBias;
    private double[] vBias;
    private double beta1 = 0.9;
    private double beta2 = 0.999;
    private double epsilon = 1e-8;
    private int t = 0;

    // 缓存输入用于反向传播
    private double[][][][] inputCache;

    public ConvolutionLayer(int inputChannels, int outputChannels, int kernelSize, double learningRate) {
        this.inputChannels = inputChannels;
        this.outputChannels = outputChannels;
        this.kernelSize = kernelSize;
        this.learningRate = learningRate;
        initializeWeights();
        initializeAdam();
    }

    private void initializeWeights() {
        weights = new double[outputChannels][inputChannels][kernelSize][kernelSize];
        double limit = Math.sqrt(6.0 / (inputChannels * kernelSize * kernelSize + outputChannels));
        for (int oc = 0; oc < outputChannels; oc++) {
            for (int ic = 0; ic < inputChannels; ic++) {
                for (int i = 0; i < kernelSize; i++) {
                    for (int j = 0; j < kernelSize; j++) {
                        weights[oc][ic][i][j] = (Math.random() * 2 * limit) - limit;
                    }
                }
            }
        }

        biases = new double[outputChannels];
        Arrays.fill(biases, 0.0);
    }

    private void initializeAdam() {
        mWeights = new double[outputChannels][inputChannels][kernelSize][kernelSize];
        vWeights = new double[outputChannels][inputChannels][kernelSize][kernelSize];
        mBias = new double[outputChannels];
        vBias = new double[outputChannels];
        for (int oc = 0; oc < outputChannels; oc++) {
            for (int ic = 0; ic < inputChannels; ic++) {
                for (int i = 0; i < kernelSize; i++) {
                    for (int j = 0; j < kernelSize; j++) {
                        mWeights[oc][ic][i][j] = 0.0;
                        vWeights[oc][ic][i][j] = 0.0;
                    }
                }
            }
            mBias[oc] = 0.0;
            vBias[oc] = 0.0;
        }
    }

    @Override
    public double[][][][] forward(double[][][][] input) {
        this.inputCache = input;
        int batchSize = input.length;
        int inputHeight = input[0][0].length;
        int inputWidth = input[0][0][0].length;
        int outputHeight = inputHeight - kernelSize + 1;
        int outputWidth = inputWidth - kernelSize + 1;
        double[][][][] output = new double[batchSize][outputChannels][outputHeight][outputWidth];

        for (int b = 0; b < batchSize; b++) {
            for (int oc = 0; oc < outputChannels; oc++) {
                for (int oh = 0; oh < outputHeight; oh++) {
                    for (int ow = 0; ow < outputWidth; ow++) {
                        double sum = 0.0;
                        for (int ic = 0; ic < inputChannels; ic++) {
                            for (int kh = 0; kh < kernelSize; kh++) {
                                for (int kw = 0; kw < kernelSize; kw++) {
                                    sum += input[b][ic][oh + kh][ow + kw] * weights[oc][ic][kh][kw];
                                }
                            }
                        }
                        sum += biases[oc];
                        output[b][oc][oh][ow] = sum;
                    }
                }
            }
        }
        return output;
    }

    @Override
    public double[][][][] backward(double[][][][] gradOutput, double learningRate) {
        int batchSize = gradOutput.length;
        int outputHeight = gradOutput[0][0].length;
        int outputWidth = gradOutput[0][0][0].length;
        int inputHeight = inputCache[0][0].length;
        int inputWidth = inputCache[0][0][0].length;

        // 初始化梯度
        weightGradients = new double[outputChannels][inputChannels][kernelSize][kernelSize];
        biasGradients = new double[outputChannels];
        double[][][][] gradInput = new double[batchSize][inputChannels][inputHeight][inputWidth];

        // 计算梯度
        for (int b = 0; b < batchSize; b++) {
            for (int oc = 0; oc < outputChannels; oc++) {
                for (int oh = 0; oh < outputHeight; oh++) {
                    for (int ow = 0; ow < outputWidth; ow++) {
                        double grad = gradOutput[b][oc][oh][ow];
                        biasGradients[oc] += grad;
                        for (int ic = 0; ic < inputChannels; ic++) {
                            for (int kh = 0; kh < kernelSize; kh++) {
                                for (int kw = 0; kw < kernelSize; kw++) {
                                    weightGradients[oc][ic][kh][kw] += inputCache[b][ic][oh + kh][ow + kw] * grad;
                                    gradInput[b][ic][oh + kh][ow + kw] += weights[oc][ic][kh][kw] * grad;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 更新权重和偏置使用Adam优化器
        t += 1;
        for (int oc = 0; oc < outputChannels; oc++) {
            for (int ic = 0; ic < inputChannels; ic++) {
                for (int kh = 0; kh < kernelSize; kh++) {
                    for (int kw = 0; kw < kernelSize; kw++) {
                        // 更新第一和第二矩
                        mWeights[oc][ic][kh][kw] = beta1 * mWeights[oc][ic][kh][kw] + (1 - beta1) * weightGradients[oc][ic][kh][kw];
                        vWeights[oc][ic][kh][kw] = beta2 * vWeights[oc][ic][kh][kw] + (1 - beta2) * weightGradients[oc][ic][kh][kw] * weightGradients[oc][ic][kh][kw];

                        // 计算偏差校正后的矩
                        double mHat = mWeights[oc][ic][kh][kw] / (1 - Math.pow(beta1, t));
                        double vHat = vWeights[oc][ic][kh][kw] / (1 - Math.pow(beta2, t));

                        // 更新权重
                        weights[oc][ic][kh][kw] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon) + learningRate * L2_REGULARIZATION * weights[oc][ic][kh][kw];
                    }
                }
            }

            // 更新偏置
            mBias[oc] = beta1 * mBias[oc] + (1 - beta1) * biasGradients[oc];
            vBias[oc] = beta2 * vBias[oc] + (1 - beta2) * biasGradients[oc] * biasGradients[oc];
            double mHatBias = mBias[oc] / (1 - Math.pow(beta1, t));
            double vHatBias = vBias[oc] / (1 - Math.pow(beta2, t));
            biases[oc] -= learningRate * mHatBias / (Math.sqrt(vHatBias) + epsilon);
        }

        return gradInput;
    }
}
