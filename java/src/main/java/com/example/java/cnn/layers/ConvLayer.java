package com.example.java.cnn.layers;

import com.example.java.cnn.activations.Activation;
import com.example.java.cnn.utils.Matrix;
import lombok.Getter;
import lombok.Setter;

import java.util.Random;

/**
 * 卷积层实现。
 */
@Getter
@Setter
public class ConvLayer implements Layer {
    private double[][] kernel; // 卷积核
    private double bias;       // 偏置
    private Activation activation; // 激活函数
    private int stride;        // 步幅
    private String padding;    // 填充方式

    private double[][] input;  // 保存前向传播的输入，用于反向传播
    private double[][] convOutput; // 卷积后的输出（未激活）
    private double[][] activatedOutput; // 应用激活函数后的输出

    // 梯度
    private double[][] gradKernel;
    private double gradBias;

    /**
     * 构造函数，初始化卷积层参数。
     *
     * @param kernelSize    卷积核大小（假设为方形）
     * @param activation    激活函数
     * @param stride        步幅
     * @param padding       填充方式（"same" 或 "valid"）
     */
    public ConvLayer(int kernelSize, Activation activation, int stride, String padding) {
        this.kernel = new double[kernelSize][kernelSize];
        this.bias = 0.0;
        this.activation = activation;
        this.stride = stride;
        this.padding = padding;
        initializeKernel();
    }

    /**
     * 初始化卷积核权重，使用随机小值。
     */
    private void initializeKernel() {
        Random rand = new Random();
        for(int i=0; i<kernel.length; i++) {
            for(int j=0; j<kernel[0].length; j++) {
                kernel[i][j] = rand.nextGaussian() * 0.01; // 使用高斯分布初始化
            }
        }
    }

    /**
     * 前向传播，执行卷积操作并应用激活函数。
     *
     * @param input 输入矩阵
     * @return 激活后的输出矩阵
     */
    @Override
    public double[][] forward(double[][] input) {
        this.input = input;
        // 执行卷积
        convOutput = Matrix.convolve(input, kernel, stride, padding);
        // 添加偏置
        for(int i=0;i<convOutput.length;i++) {
            for(int j=0;j<convOutput[0].length;j++) {
                convOutput[i][j] += bias;
            }
        }
        // 应用激活函数
        activatedOutput = Matrix.applyActivation(convOutput, activation);
        return activatedOutput;
    }

    /**
     * 反向传播，计算梯度并更新权重和偏置。
     *
     * @param gradOutput 上一层传递的梯度
     * @param learningRate 学习率
     * @return 传递给前一层的梯度
     */
    @Override
    public double[][] backward(double[][] gradOutput, double learningRate) {
        // 计算激活函数的导数
        double[][] gradActivation = new double[gradOutput.length][gradOutput[0].length];
        for(int i=0;i<gradOutput.length;i++) {
            for(int j=0;j<gradOutput[0].length;j++) {
                gradActivation[i][j] = gradOutput[i][j] * activation.derivative(convOutput[i][j]);
            }
        }

        // 计算偏置梯度
        gradBias = 0.0;
        for(int i=0;i<gradActivation.length;i++) {
            for(int j=0;j<gradActivation[0].length;j++) {
                gradBias += gradActivation[i][j];
            }
        }

        // 计算卷积核梯度
        int kernelSize = kernel.length;
        gradKernel = new double[kernelSize][kernelSize];
        for(int m=0; m<kernelSize; m++) {
            for(int n=0; n<kernelSize; n++) {
                double sum = 0.0;
                for(int i=0; i<gradActivation.length; i++) {
                    for(int j=0; j<gradActivation[0].length; j++) {
                        int inputRow = i * stride + m;
                        int inputCol = j * stride + n;
                        if(inputRow < input.length && inputCol < input[0].length) {
                            sum += input[inputRow][inputCol] * gradActivation[i][j];
                        }
                    }
                }
                gradKernel[m][n] = sum;
            }
        }

        // 更新卷积核和偏置
        for(int m=0; m<kernel.length; m++) {
            for(int n=0; n<kernel[0].length; n++) {
                kernel[m][n] -= learningRate * gradKernel[m][n];
            }
        }
        bias -= learningRate * gradBias;

        // 计算传递给前一层的梯度（梯度传播）
        // 这里需要对输入进行卷积操作，使用旋转180度的卷积核
        double[][] rotatedKernel = rotate180(kernel);
        int pad = (padding.equalsIgnoreCase("same")) ? kernel.length - 1 : 0;
        double[][] paddedGradActivation = padGradOutput(gradActivation, pad);
        double[][] gradInput = Matrix.convolve(paddedGradActivation, rotatedKernel, 1, "valid");

        return gradInput;
    }

    /**
     * 将卷积核旋转180度，用于反向传播中的梯度传播。
     *
     * @param kernel 原始卷积核
     * @return 旋转后的卷积核
     */
    private double[][] rotate180(double[][] kernel) {
        int size = kernel.length;
        double[][] rotated = new double[size][size];
        for(int i=0;i<size;i++) {
            for(int j=0;j<size;j++) {
                rotated[i][j] = kernel[size - 1 - i][size - 1 - j];
            }
        }
        return rotated;
    }

    /**
     * 对梯度输出进行填充，以适应反向传播时的卷积操作。
     *
     * @param gradOutput 需要填充的梯度输出
     * @param pad        填充量
     * @return 填充后的梯度输出
     */
    private double[][] padGradOutput(double[][] gradOutput, int pad) {
        if(pad == 0) return gradOutput;
        int originalHeight = gradOutput.length;
        int originalWidth = gradOutput[0].length;
        int newHeight = originalHeight + 2 * pad;
        int newWidth = originalWidth + 2 * pad;
        double[][] padded = new double[newHeight][newWidth];
        for(int i=0;i<originalHeight;i++) {
            System.arraycopy(gradOutput[i], 0, padded[i + pad], pad, originalWidth);
        }
        return padded;
    }
}
