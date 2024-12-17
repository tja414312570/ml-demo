package com.example.java.cnn;


/**
 * 最大池化层实现，使用2x2池化窗口，步幅为2。
 */
public class MaxPoolingLayer implements Layer {
    private int poolSize;
    private int stride;
    private double[][][][] inputCache;
    private int[][][][] maxIndices;

    public MaxPoolingLayer(int poolSize, int stride) {
        this.poolSize = poolSize;
        this.stride = stride;
    }

    @Override
    public double[][][][] forward(double[][][][] input) {
        this.inputCache = input;
        int batchSize = input.length;
        int channels = input[0].length;
        int inputHeight = input[0][0].length;
        int inputWidth = input[0][0][0].length;
        int outputHeight = (inputHeight - poolSize) / stride + 1;
        int outputWidth = (inputWidth - poolSize) / stride + 1;
        double[][][][] output = new double[batchSize][channels][outputHeight][outputWidth];
        maxIndices = new int[batchSize][channels][outputHeight][outputWidth];

        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < channels; c++) {
                for (int oh = 0; oh < outputHeight; oh++) {
                    for (int ow = 0; ow < outputWidth; ow++) {
                        double max = Double.NEGATIVE_INFINITY;
                        int maxIndex = -1;
                        for (int ph = 0; ph < poolSize; ph++) {
                            for (int pw = 0; pw < poolSize; pw++) {
                                int currentH = oh * stride + ph;
                                int currentW = ow * stride + pw;
                                if (currentH < inputHeight && currentW < inputWidth) {
                                    if (input[b][c][currentH][currentW] > max) {
                                        max = input[b][c][currentH][currentW];
                                        maxIndex = ph * poolSize + pw;
                                    }
                                }
                            }
                        }
                        output[b][c][oh][ow] = max;
                        maxIndices[b][c][oh][ow] = maxIndex;
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
        int outputHeight = gradOutput[0][0].length;
        int outputWidth = gradOutput[0][0][0].length;
        int inputHeight = inputCache[0][0].length;
        int inputWidth = inputCache[0][0][0].length;
        double[][][][] gradInput = new double[batchSize][channels][inputHeight][inputWidth];

        for (int b = 0; b < batchSize; b++) {
            for (int c = 0; c < channels; c++) {
                for (int oh = 0; oh < outputHeight; oh++) {
                    for (int ow = 0; ow < outputWidth; ow++) {
                        int maxIndex = maxIndices[b][c][oh][ow];
                        int ph = maxIndex / poolSize;
                        int pw = maxIndex % poolSize;
                        int currentH = oh * stride + ph;
                        int currentW = ow * stride + pw;
                        if (currentH < inputHeight && currentW < inputWidth) {
                            gradInput[b][c][currentH][currentW] += gradOutput[b][c][oh][ow];
                        }
                    }
                }
            }
        }
        return gradInput;
    }
}
