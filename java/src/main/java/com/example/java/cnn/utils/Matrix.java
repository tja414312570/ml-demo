package com.example.java.cnn.utils;

import com.example.java.cnn.activations.Activation;

/**
 * 矩阵操作工具类，提供基本的矩阵运算方法。
 */
public class Matrix {

    /**
     * 执行二维卷积操作。
     *
     * @param input    输入矩阵
     * @param kernel   卷积核
     * @param stride   步幅
     * @param padding  填充方式（"same" 或 "valid"）
     * @return 卷积后的输出矩阵
     */
    public static double[][] convolve(double[][] input, double[][] kernel, int stride, String padding) {
        int inputHeight = input.length;
        int inputWidth = input[0].length;
        int kernelSize = kernel.length;
        int outputHeight, outputWidth;

        if (padding.equalsIgnoreCase("same")) {
            // 计算填充量，使输出尺寸与输入相同
            int padHeight = ((inputHeight - 1) * stride + kernelSize - inputHeight) / 2;
            int padWidth = ((inputWidth - 1) * stride + kernelSize - inputWidth) / 2;
            input = padInput(input, padHeight, padWidth);
            outputHeight = inputHeight;
            outputWidth = inputWidth;
        } else {
            // "valid" 填充，不进行填充
            outputHeight = (inputHeight - kernelSize) / stride + 1;
            outputWidth = (inputWidth - kernelSize) / stride + 1;
        }

        double[][] output = new double[outputHeight][outputWidth];

        for (int i = 0; i < outputHeight; i++) {
            for (int j = 0; j < outputWidth; j++) {
                double sum = 0.0;
                for (int m = 0; m < kernelSize; m++) {
                    for (int n = 0; n < kernelSize; n++) {
                        int row = i * stride + m;
                        int col = j * stride + n;
                        sum += input[row][col] * kernel[m][n];
                    }
                }
                output[i][j] = sum;
            }
        }

        return output;
    }

    /**
     * 将激活函数应用于每个矩阵元素。
     *
     * @param input      输入矩阵
     * @param activation 激活函数
     * @return 应用激活函数后的输出矩阵
     */
    public static double[][] applyActivation(double[][] input, Activation activation) {
        int height = input.length;
        int width = input[0].length;
        double[][] output = new double[height][width];
        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                output[i][j] = activation.activate(input[i][j]);
            }
        }
        return output;
    }

    /**
     * 对输入矩阵进行填充。
     *
     * @param input      原始输入矩阵
     * @param padHeight  垂直方向的填充量
     * @param padWidth   水平方向的填充量
     * @return 填充后的矩阵
     */
    private static double[][] padInput(double[][] input, int padHeight, int padWidth) {
        int originalHeight = input.length;
        int originalWidth = input[0].length;
        int newHeight = originalHeight + 2 * padHeight;
        int newWidth = originalWidth + 2 * padWidth;
        double[][] padded = new double[newHeight][newWidth];

        for (int i = 0; i < originalHeight; i++) {
            System.arraycopy(input[i], 0, padded[i + padHeight], padWidth, originalWidth);
        }

        return padded;
    }

    /**
     * 计算矩阵的转置。
     *
     * @param matrix 输入矩阵
     * @return 转置后的矩阵
     */
    public static double[][] transpose(double[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;
        double[][] transposed = new double[cols][rows];
        for(int i=0;i<rows;i++) {
            for(int j=0;j<cols;j++) {
                transposed[j][i] = matrix[i][j];
            }
        }
        return transposed;
    }

    /**
     * 计算两个矩阵的逐元素相乘（Hadamard积）。
     *
     * @param a 矩阵A
     * @param b 矩阵B
     * @return 逐元素相乘后的矩阵
     */
    public static double[][] hadamard(double[][] a, double[][] b) {
        int rows = a.length;
        int cols = a[0].length;
        double[][] result = new double[rows][cols];
        for(int i=0;i<rows;i++) {
            for(int j=0;j<cols;j++) {
                result[i][j] = a[i][j] * b[i][j];
            }
        }
        return result;
    }

    /**
     * 计算两个矩阵的逐元素加法。
     *
     * @param a 矩阵A
     * @param b 矩阵B
     * @return 逐元素相加后的矩阵
     */
    public static double[][] add(double[][] a, double[][] b) {
        int rows = a.length;
        int cols = a[0].length;
        double[][] result = new double[rows][cols];
        for(int i=0;i<rows;i++) {
            for(int j=0;j<cols;j++) {
                result[i][j] = a[i][j] + b[i][j];
            }
        }
        return result;
    }

    /**
     * 将二维矩阵展平为一维数组。
     *
     * @param matrix 输入二维矩阵
     * @return 展平后的数组
     */
    public static double[] flatten(double[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;
        double[] flat = new double[rows * cols];
        int index = 0;
        for(double[] row : matrix) {
            for(double val : row) {
                flat[index++] = val;
            }
        }
        return flat;
    }

    /**
     * 将一维数组重塑为二维矩阵。
     *
     * @param array 输入一维数组
     * @param rows  目标行数
     * @param cols  目标列数
     * @return 重塑后的二维矩阵
     */
    public static double[][] reshape(double[] array, int rows, int cols) {
        double[][] matrix = new double[rows][cols];
        for(int i=0;i<rows;i++) {
            System.arraycopy(array, i*cols, matrix[i], 0, cols);
        }
        return matrix;
    }
}
