package com.example.java.cnn.activations;

/**
 * Softmax激活函数实现。
 * 注意：Softmax通常与交叉熵损失一起使用，因此其导数在损失计算中直接体现。
 */
public class Softmax implements Activation {

    /**
     * 前向计算Softmax激活函数。
     *
     * @param input 输入数组
     * @return 应用Softmax后的概率分布
     */
    public double[] applySoftmax(double[] input) {
        double max = Double.NEGATIVE_INFINITY;
        for (double val : input) {
            if (val > max) max = val;
        }

        double sum = 0.0;
        double[] exps = new double[input.length];
        for (int i = 0; i < input.length; i++) {
            exps[i] = Math.exp(input[i] - max); // 减去max以提高数值稳定性
            sum += exps[i];
        }

        double[] output = new double[input.length];
        for (int i = 0; i < input.length; i++) {
            output[i] = exps[i] / sum;
        }
        return output;
    }

    /**
     * Softmax的导数在与交叉熵损失函数结合时简化为 (预测 - 真实标签)。
     * 因此，直接返回输入值。
     *
     * @param x 输入值（未使用）
     * @return x（未使用）
     */
    @Override
    public double activate(double x) {
        // 不直接使用
        return x;
    }

    @Override
    public double derivative(double x) {
        // 不直接使用
        return x;
    }
}
