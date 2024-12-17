// 文件: ActivationLayer.java
package com.example.java.cnn;

/**
 * ReLU激活层实现。
 */
public class ActivationLayer implements Layer {
    private double[][][][] inputCache;

    @Override
    public double[][][][] forward(double[][][][] input) {
        this.inputCache = input;
        int batchSize = input.length;
        int channels = input[0].length;
        int height = input[0][0].length;
        int width = input[0][0][0].length;
        double[][][][] output = new double[batchSize][channels][height][width];

        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < channels; c++) {
                for (int h = 0; h < height; h++) {
                    for (int w = 0; w < width; w++) {
                        output[b][c][h][w] = Math.max(0, input[b][c][h][w]);
                    }
                }
            }
        }
        return output;
    }

    @Override
    public double[][][][] backward(double[][][][] gradOutput, double learningRate) {
        int batchSize = gradOutput.length;
        int channels = gradOutput[0].length;
        int height = gradOutput[0][0].length;
        int width = gradOutput[0][0][0].length;
        double[][][][] gradInput = new double[batchSize][channels][height][width];

        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < channels; c++) {
                for (int h = 0; h < height; h++) {
                    for (int w = 0; w < width; w++) {
                        gradInput[b][c][h][w] = inputCache[b][c][h][w] > 0 ? gradOutput[b][c][h][w] : 0;
                    }
                }
            }
        }
        return gradInput;
    }
}
