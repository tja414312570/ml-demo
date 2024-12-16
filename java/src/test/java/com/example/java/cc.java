// 文件: Layer.java
package com.example.java;

/**
 * 网络层接口，所有网络层都需要实现该接口。
 */
public interface Layer {
    /**
     * 前向传播
     *
     * @param input 当前层的输入，形状 [batchSize][channels][height][width]
     * @return 当前层的输出，形状 [batchSize][channels][height][width]
     */
    double[][][][] forward(double[][][][] input);

    /**
     * 反向传播
     *
     * @param gradOutput 当前层输出的梯度，形状 [batchSize][channels][height][width]
     * @param learningRate 学习率
     * @return 当前层输入的梯度，形状 [batchSize][channels][height][width]
     */
    double[][][][] backward(double[][][][] gradOutput, double learningRate);
}
