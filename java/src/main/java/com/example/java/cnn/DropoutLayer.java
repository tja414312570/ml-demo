// 文件: DropoutLayer.java
package com.example.java.cnn;

import java.util.Random;

/**
 * Dropout层实现，用于防止过拟合。
 */
public class DropoutLayer implements Layer {
    private double dropoutRate;
    private boolean[][][][] mask;
    private Random random;

    public DropoutLayer(double dropoutRate) {
        this.dropoutRate = dropoutRate;
        this.random = new Random();
    }

    @Override
    public double[][][][] forward(double[][][][] input) {
        int batchSize = input.length;
        int channels = input[0].length;
        int height = input[0][0].length;
        int width = input[0][0][0].length;
        mask = new boolean[batchSize][channels][height][width];
        double[][][][] output = new double[batchSize][channels][height][width];

        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < channels; c++) {
                for (int h = 0; h < height; h++) {
                    for (int w = 0; w < width; w++) {
                        double randVal = random.nextDouble();
                        if (randVal > dropoutRate) {
                            output[b][c][h][w] = input[b][c][h][w] / (1.0 - dropoutRate);
                            mask[b][c][h][w] = true;
                        } else {
                            output[b][c][h][w] = 0.0;
                            mask[b][c][h][w] = false;
                        }
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
                        if (mask[b][c][h][w]) {
                            gradInput[b][c][h][w] = gradOutput[b][c][h][w] / (1.0 - dropoutRate);
                        } else {
                            gradInput[b][c][h][w] = 0.0;
                        }
                    }
                }
            }
        }
        return gradInput;
    }
}
