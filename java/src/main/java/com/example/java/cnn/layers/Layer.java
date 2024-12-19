package com.example.java.cnn.layers;

/**
 * 层接口，定义前向和反向传播的方法。
 */
public interface Layer {
    /**
     * 前向传播。
     *
     * @param input 输入数据
     * @return 输出数据
     */
    double[][] forward(double[][] input);

    /**
     * 反向传播。
     *
     * @param gradOutput 上一层传递的梯度
     * @param learningRate 学习率
     * @return 传递给前一层的梯度
     */
    double[][] backward(double[][] gradOutput, double learningRate);
}
