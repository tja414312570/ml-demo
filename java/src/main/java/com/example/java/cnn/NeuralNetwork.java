package com.example.java.cnn;

import com.example.java.cnn.activations.Softmax;
import com.example.java.cnn.layers.Layer;
import com.example.java.cnn.loss.CrossEntropyLoss;
import com.example.java.cnn.utils.Matrix;

import java.util.ArrayList;
import java.util.List;

/**
 * 神经网络实现，管理网络层并执行前向和反向传播。
 */
public class NeuralNetwork {
    private List<Layer> layers; // 网络中的各层
    private CrossEntropyLoss lossFunction; // 损失函数
    private Softmax softmax; // Softmax激活函数，用于输出层

    /**
     * 构造函数，初始化网络。
     */
    public NeuralNetwork() {
        layers = new ArrayList<>();
        lossFunction = new CrossEntropyLoss();
        softmax = new Softmax();
    }

    /**
     * 添加一层到网络中。
     *
     * @param layer 需要添加的层
     */
    public void addLayer(Layer layer) {
        layers.add(layer);
    }

    /**
     * 前向传播，经过所有网络层。
     *
     * @param input 输入数据
     * @return 输出概率分布
     */
    public double[] forward(double[][] input) {
        double[][] output = input;
        for(Layer layer : layers) {
            output = layer.forward(output);
        }
        // 应用Softmax激活函数于最后一层的输出
        double[] logits = Matrix.flatten(output);
        double[] probabilities = softmax.applySoftmax(logits);
        return probabilities;
    }

    /**
     * 计算损失。
     *
     * @param predictions 预测的概率分布
     * @param labels      真实标签的One-Hot编码
     * @return 损失值
     */
    public double computeLoss(double[] predictions, double[] labels) {
        return lossFunction.computeLoss(predictions, labels);
    }

    /**
     * 反向传播，更新网络中的所有层。
     *
     * @param predictions 预测的概率分布
     * @param labels      真实标签的One-Hot编码
     * @param learningRate 学习率
     */
    public void backward(double[] predictions, double[] labels, double learningRate) {
        // 计算损失函数相对于预测的梯度
        double[] gradLoss = lossFunction.computeGradient(predictions, labels);
        // 将梯度转换为二维矩阵（1xN）
        double[][] gradOutput = Matrix.reshape(gradLoss, 1, gradLoss.length);

        // 反向传播通过各层
        for(int i=layers.size()-1; i>=0; i--) {
            gradOutput = layers.get(i).backward(gradOutput, learningRate);
        }
    }

    /**
     * 训练网络一次。
     *
     * @param input        输入数据
     * @param label        真实标签的One-Hot编码
     * @param learningRate 学习率
     * @return 当前样本的损失值
     */
    public double trainSample(double[][] input, double[] label, double learningRate) {
        // 前向传播
        double[] predictions = forward(input);
        // 计算损失
        double loss = computeLoss(predictions, label);
        // 反向传播
        backward(predictions, label, learningRate);
        return loss;
    }

    /**
     * 预测标签，选择概率最高的类别。
     *
     * @param input 输入数据
     * @return 预测的类别标签
     */
    public int predict(double[][] input) {
        double[] predictions = forward(input);
        int predictedLabel = 0;
        double maxProb = predictions[0];
        for(int i=1;i<predictions.length;i++) {
            if(predictions[i] > maxProb) {
                maxProb = predictions[i];
                predictedLabel = i;
            }
        }
        return predictedLabel;
    }
}
