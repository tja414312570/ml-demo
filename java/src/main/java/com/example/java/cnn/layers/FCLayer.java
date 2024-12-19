package com.example.java.cnn.layers;

import com.example.java.cnn.activations.Activation;
import com.example.java.cnn.utils.Matrix;
import lombok.Getter;
import lombok.Setter;

import java.util.Random;

/**
 * 全连接层实现。
 */
@Getter
@Setter
public class FCLayer implements Layer {
    private double[][] weights; // 权重矩阵
    private double[] biases;    // 偏置向量
    private Activation activation; // 激活函数

    private double[] input;     // 前向传播的输入（展平后的）
    private double[] output;    // 前向传播的输出

    // 梯度
    private double[][] gradWeights;
    private double[] gradBiases;

    /**
     * 构造函数，初始化全连接层参数。
     *
     * @param inputSize   输入节点数
     * @param outputSize  输出节点数
     * @param activation  激活函数
     */
    public FCLayer(int inputSize, int outputSize, Activation activation) {
        this.weights = new double[outputSize][inputSize];
        this.biases = new double[outputSize];
        this.activation = activation;
        // 初始化梯度相关变量
        this.gradWeights = new double[outputSize][inputSize];
        this.gradBiases = new double[outputSize]; // 初始化为0向量
        initializeParameters();
    }

    /**
     * 初始化权重和偏置，权重使用随机小值初始化，偏置初始化为0。
     */
    private void initializeParameters() {
        Random rand = new Random();
        for(int i=0;i<weights.length;i++) {
            biases[i] = 0.0;
            for(int j=0;j<weights[0].length;j++) {
                weights[i][j] = rand.nextGaussian() * 0.01; // 高斯分布初始化
            }
        }
    }

    /**
     * 前向传播，执行线性变换并应用激活函数。
     *
     * @param inputMatrix 输入矩阵（1xN）
     * @return 激活后的输出矩阵（1xM）
     */
    @Override
    public double[][] forward(double[][] inputMatrix) {
        // 将输入展平为一维数组
        this.input = Matrix.flatten(inputMatrix);

        // 线性变换：z = Wx + b
        int outputSize = weights.length;
        output = new double[outputSize];
        for(int i=0;i<outputSize;i++) {
            double sum = biases[i];
            for(int j=0;j<input.length;j++) {
                sum += weights[i][j] * input[j];
            }
            output[i] = activation.activate(sum);
        }

        // 将输出转换为二维矩阵（1xM）
        double[][] outputMatrix = new double[1][output.length];
        System.arraycopy(output, 0, outputMatrix[0], 0, output.length);
        return outputMatrix;
    }

    /**
     * 反向传播，计算梯度并更新权重和偏置。
     *
     * @param gradOutput 上一层传递的梯度
     * @param learningRate 学习率
     * @return 传递给前一层的梯度
     */
    @Override
    public double[][] backward(double[][] gradOutput, double learningRate) {
        // gradOutput 是 (1 x M) 矩阵
        double[] gradOutputFlat = Matrix.flatten(gradOutput);

        // 计算激活函数的导数
        double[] gradActivation = new double[gradOutputFlat.length];
        for(int i=0;i<gradOutputFlat.length;i++) {
            gradActivation[i] = gradOutputFlat[i] * activation.derivative(output[i]);
        }

        // 计算偏置梯度
        gradBiases = new double[gradBiases.length];
        for(int i=0;i<gradActivation.length;i++) {
            gradBiases[i] = gradActivation[i];
        }

        // 计算权重梯度
        gradWeights = new double[weights.length][weights[0].length];
        for(int i=0;i<weights.length;i++) {
            for(int j=0;j<weights[0].length;j++) {
                gradWeights[i][j] = gradActivation[i] * input[j];
            }
        }

        // 更新权重和偏置
        for(int i=0;i<weights.length;i++) {
            biases[i] -= learningRate * gradBiases[i];
            for(int j=0;j<weights[0].length;j++) {
                weights[i][j] -= learningRate * gradWeights[i][j];
            }
        }

        // 计算传递给前一层的梯度
        double[] gradInput = new double[input.length];
        for(int i=0;i<weights.length;i++) {
            for(int j=0;j<weights[0].length;j++) {
                gradInput[j] += weights[i][j] * gradActivation[i];
            }
        }

        // 将梯度输入转换为二维矩阵（1xN）
        double[][] gradInputMatrix = Matrix.reshape(gradInput, 1, gradInput.length);
        return gradInputMatrix;
    }
}
