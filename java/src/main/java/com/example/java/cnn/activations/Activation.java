package com.example.java.cnn.activations;

/**
 * 激活函数接口，定义激活函数及其导数。
 */
public interface Activation {
    /**
     * 激活函数的前向计算。
     *
     * @param x 输入值
     * @return 激活后的输出
     */
    double activate(double x);

    /**
     * 激活函数的导数，用于反向传播。
     *
     * @param x 输入值
     * @return 导数值
     */
    double derivative(double x);
}
