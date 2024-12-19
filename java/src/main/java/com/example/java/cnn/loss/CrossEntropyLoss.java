package com.example.java.cnn.loss;

/**
 * 交叉熵损失函数实现。
 */
public class CrossEntropyLoss {

    /**
     * 计算交叉熵损失。
     *
     * @param predictions 模型预测的概率分布
     * @param labels      真实标签的One-Hot编码
     * @return 交叉熵损失值
     */
    public double computeLoss(double[] predictions, double[] labels) {
        double loss = 0.0;
        for(int i=0;i<predictions.length;i++) {
            loss -= labels[i] * Math.log(predictions[i] + 1e-15); // 加上epsilon避免log(0)
        }
        return loss;
    }

    /**
     * 计算交叉熵损失相对于预测值的梯度。
     *
     * @param predictions 模型预测的概率分布
     * @param labels      真实标签的One-Hot编码
     * @return 梯度数组
     */
    public double[] computeGradient(double[] predictions, double[] labels) {
        double[] grad = new double[predictions.length];
        for(int i=0;i<predictions.length;i++) {
            grad[i] = predictions[i] - labels[i]; // 简化的梯度表达式
        }
        return grad;
    }
}
