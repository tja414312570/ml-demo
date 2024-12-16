// 文件: SimpleCNN.java
package com.example.java;

import com.example.java.callbacks.TestingCallback;
import com.example.java.callbacks.TrainingCallback;
import com.example.java.cnn.MnistLoader.MnistData;
// 文件: SimpleCNN.java

import com.google.gson.Gson;
import lombok.Data;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * 简单的卷积神经网络实现，用于MNIST数据集分类。
 * 包含卷积层、激活层（ReLU）、池化层（最大池化）、全连接层、Dropout层和Softmax层。
 * 使用Adam优化器进行权重更新。
 */
@Data
public class SimpleCNNs {

    private static final int NUM_CLASSES = 10; // MNIST有10个类别
    private static final double LEARNING_RATE = 0.001;
    private static final double DROPOUT_RATE = 0.5;
    public static final double L2_REGULARIZATION = 0.0001;

    // 模型文件路径
    private final String modelFilePath = "cnnModel.json";

    // 网络层
    private List<Layer> layers = new ArrayList<>();
    private SoftmaxLayer softmaxLayer = new SoftmaxLayer();

    private transient TrainingCallback trainingCallbacks;
    private transient TestingCallback testingCallbacks;

    /**
     * 构造函数，初始化网络结构。
     */
    public SimpleCNNs() {
        // 定义网络结构
        // 假设输入图像为28x28，灰度图（单通道）

        // 第一卷积层：1输入通道，8输出通道，3x3卷积核
        layers.add(new ConvolutionLayer(1, 8, 3, LEARNING_RATE));
        layers.add(new ActivationLayer());
        layers.add(new MaxPoolingLayer(2, 2));
        layers.add(new DropoutLayer(DROPOUT_RATE));

        // 第二卷积层：8输入通道，16输出通道，3x3卷积核
        layers.add(new ConvolutionLayer(8, 16, 3, LEARNING_RATE));
        layers.add(new ActivationLayer());
        layers.add(new MaxPoolingLayer(2, 2));
        layers.add(new DropoutLayer(DROPOUT_RATE));

        // 展平后，特征向量长度为16 * 5 * 5 = 400
        layers.add(new FullyConnectedLayer(16, 5, 5, 128, LEARNING_RATE));
        layers.add(new ActivationLayer());
        layers.add(new DropoutLayer(DROPOUT_RATE));
        layers.add(new FullyConnectedLayer(128, 1, 1, NUM_CLASSES, LEARNING_RATE));
    }

    public void train(List<MnistData> trainingData, int epochs, int batchSize) {
        // 打乱训练数据
        Collections.shuffle(trainingData);

        // 划分批次
        List<List<MnistData>> batches = createBatches(trainingData, batchSize);

        for (int epoch = 1; epoch <= epochs; epoch++) {
            trainingCallbacks.onEpochStart(epoch,epochs);
            double totalLoss = 0.0;
            int totalSamples = 0;

            for (List<MnistData> batch : batches) {
                int currentBatchSize = batch.size();
                double[][][][] batchInputs = new double[currentBatchSize][1][28][28];
                int[] batchLabels = new int[currentBatchSize];

                // 数据增强和归一化
                for (int i = 0; i < currentBatchSize; i++) {
                    MnistData sample = batch.get(i);
                    double[][] augmented = augment(sample.pixels()); // 数据增强
                    batchInputs[i][0] = normalize(augmented); // 数据归一化
                    batchLabels[i] = sample.label();
                }

                // 前向传播
                double[][][][] layerInput = batchInputs;
                for (Layer layer : layers) {
                    layerInput = layer.forward(layerInput);
                }

                // 获取最后一层全连接层的输出
                FullyConnectedLayer lastFcLayer = (FullyConnectedLayer) layers.get(layers.size() - 1);
                double[][] fcOutput = lastFcLayer.getOutput(); // [batchSize][NUM_CLASSES]

                // 计算Softmax输出和损失
                softmaxLayer.setLabels(batchLabels);
                softmaxLayer.forward(fcOutput);
                double loss = softmaxLayer.calculateLoss(L2_REGULARIZATION);
                totalLoss += loss * currentBatchSize;
                totalSamples += currentBatchSize;

                // 反向传播
                double[][] gradLoss = softmaxLayer.computeGradient(); // [batchSize][NUM_CLASSES]

                // 将 gradLoss 转换为 double[][][][] [batchSize][NUM_CLASSES][1][1]
                double[][][][] gradLoss3D = new double[currentBatchSize][NUM_CLASSES][1][1];
                for (int b = 0; b < currentBatchSize; b++) {
                    for (int c = 0; c < NUM_CLASSES; c++) {
                        gradLoss3D[b][c][0][0] = gradLoss[b][c];
                    }
                }

                // 反向传播 through layers
                double[][][][] grad = gradLoss3D;
                for (int i = layers.size() - 1; i >= 0; i--) {
                    grad = layers.get(i).backward(grad, LEARNING_RATE);
                }
            }

            double averageLoss = totalLoss / totalSamples;
            trainingCallbacks.onEpochEnd(epoch,averageLoss);
            System.out.println("Epoch " + epoch + "/" + epochs + " - Average Loss: " + String.format("%.4f", averageLoss));
        }
    }

    /**
     * 测试方法，评估模型在测试数据集上的准确率。
     *
     * @param testData 测试数据集
     * @return 模型的准确率
     */
    public double test(List<MnistData> testData) {
        int correct = 0;
        int total = testData.size();
        int current = 0;
        for (MnistData sample : testData) {
            current++;
            double[][] input = normalize(sample.pixels()); // 数据归一化
            double[] probabilities = forward(input); // 前向传播

            // 预测标签
            int predictedLabel = argMax(probabilities);
            if (predictedLabel == sample.label()) {
                correct++;
            }
            testingCallbacks.onTestProgress(current,total,sample,predictedLabel);
        }
        double accuracy = (double) correct / total;
        System.out.println("Test Accuracy: " + String.format("%.2f%%", accuracy * 100));

        return accuracy;
    }

    /**
     * 前向传播，依次通过所有网络层。
     *
     * @param input 输入图像的像素矩阵
     * @return Softmax概率分布
     */
    private double[] forward(double[][] input) {
        double[][][][] input3D = new double[1][1][28][28];
        // 将单通道输入填充到 [1][1][28][28]
        for (int h = 0; h < 28; h++) {
            for (int w = 0; w < 28; w++) {
                input3D[0][0][h][w] = input[h][w];
            }
        }
        double[][][][] output = input3D;
        for (Layer layer : layers) {
            output = layer.forward(output);
        }
        FullyConnectedLayer lastFcLayer = (FullyConnectedLayer) layers.get(layers.size() - 1);
        double[][] fcOutput = lastFcLayer.getOutput(); // [1][NUM_CLASSES]
        double[] probabilities = softmaxLayer.forward(fcOutput)[0];
        return probabilities;
    }

    /**
     * 保存模型权重到文件。
     *
     * @throws IOException 如果文件操作失败
     */
    public void saveModel() throws IOException {
        // 序列化模型参数
        Gson gson = new Gson();
        String json = gson.toJson(this);
        FileUtils.write(new File(modelFilePath), json, StandardCharsets.UTF_8);
        System.out.println("模型已保存到 " + new File(modelFilePath).getAbsolutePath());
    }

    /**
     * 从文件加载模型权重。
     *
     * @throws IOException 如果文件操作失败
     */
    public void loadModel() throws IOException {
        Gson gson = new Gson();
        String json = IOUtils.toString(new FileInputStream(modelFilePath), StandardCharsets.UTF_8);
        SimpleCNNs loadedModel = gson.fromJson(json, SimpleCNNs.class);
        this.layers = loadedModel.layers;
        this.softmaxLayer = loadedModel.softmaxLayer;
        System.out.println("模型已从 " + modelFilePath + " 加载");
    }

    /**
     * 创建批次。
     *
     * @param data      数据集
     * @param batchSize 批次大小
     * @return 批次列表
     */
    private List<List<MnistData>> createBatches(List<MnistData> data, int batchSize) {
        List<List<MnistData>> batches = new ArrayList<>();
        for (int i = 0; i < data.size(); i += batchSize) {
            batches.add(data.subList(i, Math.min(i + batchSize, data.size())));
        }
        return batches;
    }

    /**
     * 数据增强，当前示例实现为随机水平翻转。
     *
     * @param input 原始像素矩阵
     * @return 增强后的像素矩阵
     */
    private double[][] augment(double[][] input) {
        double[][] augmented = deepCopy(input);
        if (Math.random() > 0.5) {
            // 随机水平翻转
            for (int i = 0; i < augmented.length; i++) {
                for (int j = 0; j < augmented[0].length / 2; j++) {
                    double temp = augmented[i][j];
                    augmented[i][j] = augmented[i][augmented[0].length - j - 1];
                    augmented[i][augmented[0].length - j - 1] = temp;
                }
            }
        }
        // 可以添加更多数据增强方法，如旋转、缩放等
        return augmented;
    }

    /**
     * 数据归一化，将像素值缩放到 [0, 1] 范围。
     *
     * @param input 原始像素矩阵
     * @return 归一化后的像素矩阵
     */
    private double[][] normalize(double[][] input) {
        double[][] normalized = new double[input.length][input[0].length];
        for (int i = 0; i < input.length; i++) {
            for (int j = 0; j < input[0].length; j++) {
                normalized[i][j] = input[i][j] / 255.0;
            }
        }
        return normalized;
    }

    /**
     * 深拷贝二维数组。
     *
     * @param original 原始数组
     * @return 深拷贝后的数组
     */
    private double[][] deepCopy(double[][] original) {
        double[][] copy = new double[original.length][];
        for (int i = 0; i < original.length; i++) {
            copy[i] = Arrays.copyOf(original[i], original[i].length);
        }
        return copy;
    }

    /**
     * 获取数组中最大值的索引。
     *
     * @param array 输入数组
     * @return 最大值的索引
     */
    private int argMax(double[] array) {
        int maxIndex = 0;
        double max = array[0];
        for (int i = 1; i < array.length; i++) {
            if (array[i] > max) {
                max = array[i];
                maxIndex = i;
            }
        }
        return maxIndex;
    }
}
