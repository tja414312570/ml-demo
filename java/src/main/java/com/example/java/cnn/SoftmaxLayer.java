package com.example.java.cnn;

// 文件: SoftmaxLayer.java


import lombok.Data;


/**
 * Softmax层实现，包含交叉熵损失计算。
 */
@Data
public class SoftmaxLayer {
    /**
     * -- GETTER --
     *  Softmax输出。
     *
     * @return [batchSize][numClasses] 的Softmax概率
     */
    private double[][] probabilities;
    /**
     * -- SETTER --
     *  设置标签，用于计算损失和梯度。
     *
     * @param labels 标签数组
     */
    private int[] labels;

    /**
     * 前向传播，计算Softmax概率分布。
     *
     * @param input [batchSize][numClasses] 的输入
     * @return [batchSize][numClasses] 的Softmax概率
     */
    public double[][] forward(double[][] input) {
        int batchSize = input.length;
        int numClasses = input[0].length;
        probabilities = new double[batchSize][numClasses];
        for (int b = 0; b < batchSize; b++) {
            double max = Double.NEGATIVE_INFINITY;
            for (int c = 0; c < numClasses; c++) {
                if (input[b][c] > max) {
                    max = input[b][c];
                }
            }
            double sum = 0.0;
            for (int c = 0; c < numClasses; c++) {
                probabilities[b][c] = Math.exp(input[b][c] - max); // 防止溢出
                sum += probabilities[b][c];
            }
            for (int c = 0; c < numClasses; c++) {
                probabilities[b][c] /= sum;
            }
        }
        return probabilities;
    }

    /**
     * 计算交叉熵损失，包含L2正则化。
     *
     * @param lambda L2正则化系数
     * @return 交叉熵损失
     */
    public double calculateLoss(double lambda) {
        double loss = 0.0;
        int batchSize = probabilities.length;
        for (int b = 0; b < batchSize; b++) {
            loss -= Math.log(probabilities[b][labels[b]] + 1e-15);
        }
        loss /= batchSize;

        // L2正则化
        // 需要外部提供权重参数，此处假设L2正则化已在各层中处理
        loss += 0.0; // 如果需要，可以在这里添加L2正则化项
        return loss;
    }

    /**
     * 计算损失相对于输入的梯度。
     *
     * @return [batchSize][numClasses] 的梯度
     */
    public double[][] computeGradient() {
        int batchSize = probabilities.length;
        int numClasses = probabilities[0].length;
        double[][] grad = new double[batchSize][numClasses];
        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < numClasses; c++) {
                grad[b][c] = probabilities[b][c];
            }
            grad[b][labels[b]] -= 1.0;
            for (int c = 0; c < numClasses; c++) {
                grad[b][c] /= batchSize;
            }
        }
        return grad;
    }

}
