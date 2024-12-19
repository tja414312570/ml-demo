package com.example.java.cnn.activations;

/**
 * ReLU激活函数实现。
 */
public class ReLU implements Activation {

    /**
     * 前向计算ReLU激活函数。
     *
     * @param x 输入值
     * @return max(0, x)
     */
    @Override
    public double activate(double x) {
        return Math.max(0, x);
    }

    /**
     * 计算ReLU激活函数的导数。
     *
     * @param x 输入值
     * @return x > 0 ? 1 : 0
     */
    @Override
    public double derivative(double x) {
        return x > 0 ? 1.0 : 0.0;
    }
}
