package com.example.java.cnn.layers;

import lombok.Getter;
import lombok.Setter;

/**
 * 最大池化层实现。
 */
@Getter
@Setter
public class PoolLayer implements Layer {
    private int poolSize; // 池化窗口大小
    private int stride;    // 步幅

    private double[][] input;      // 前向传播的输入
    private int[][] maxIndices;    // 记录池化窗口中的最大值位置，用于反向传播

    /**
     * 构造函数，初始化池化层参数。
     *
     * @param poolSize 池化窗口大小（假设为方形）
     * @param stride   步幅
     */
    public PoolLayer(int poolSize, int stride) {
        this.poolSize = poolSize;
        this.stride = stride;
    }

    /**
     * 前向传播，执行最大池化操作。
     *
     * @param input 输入矩阵
     * @return 池化后的输出矩阵
     */
    @Override
    public double[][] forward(double[][] input) {
        this.input = input;
        int inputHeight = input.length;
        int inputWidth = input[0].length;
        int outputHeight = (inputHeight - poolSize) / stride + 1;
        int outputWidth = (inputWidth - poolSize) / stride + 1;
        double[][] output = new double[outputHeight][outputWidth];
        maxIndices = new int[outputHeight * outputWidth][2]; // 记录每个池化窗口的最大值索引

        int count = 0;
        for(int i=0; i<outputHeight; i++) {
            for(int j=0; j<outputWidth; j++) {
                double max = Double.NEGATIVE_INFINITY;
                int maxRow = -1, maxCol = -1;
                for(int m=0; m<poolSize; m++) {
                    for(int n=0; n<poolSize; n++) {
                        int row = i * stride + m;
                        int col = j * stride + n;
                        if(input[row][col] > max) {
                            max = input[row][col];
                            maxRow = row;
                            maxCol = col;
                        }
                    }
                }
                output[i][j] = max;
                maxIndices[count][0] = maxRow;
                maxIndices[count][1] = maxCol;
                count++;
            }
        }

        return output;
    }

    /**
     * 反向传播，计算梯度并传递给前一层。
     *
     * @param gradOutput 上一层传递的梯度
     * @param learningRate 学习率（池化层无参数，不使用）
     * @return 传递给前一层的梯度
     */
    @Override
    public double[][] backward(double[][] gradOutput, double learningRate) {
        int outputHeight = gradOutput.length;
        int outputWidth = gradOutput[0].length;
        double[][] gradInput = new double[input.length][input[0].length];
        int count = 0;
        for(int i=0; i<outputHeight; i++) {
            for(int j=0; j<outputWidth; j++) {
                int maxRow = maxIndices[count][0];
                int maxCol = maxIndices[count][1];
                gradInput[maxRow][maxCol] += gradOutput[i][j];
                count++;
            }
        }
        return gradInput;
    }
}
