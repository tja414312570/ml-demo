package com.example.java;

import com.example.java.cnn.NeuralNetwork;
import com.example.java.cnn.activations.ReLU;
import com.example.java.cnn.activations.Softmax;
import com.example.java.cnn.callbacks.TestingCallback;
import com.example.java.cnn.callbacks.TrainingCallback;
import com.example.java.cnn.MnistLoader;
import com.example.java.cnn.layers.ConvLayer;
import com.example.java.cnn.layers.FCLayer;
import com.example.java.cnn.layers.PoolLayer;
import com.example.java.fnn.XorFnn;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@SpringBootTest
class JavaApplicationTests {
	@Autowired
	private XorFnn xorFnn;
	@Autowired
	private MnistLoader mnistLoader;

	@Test
	void fnn() {
		System.err.println(xorFnn);
		xorFnn.train(10000); // 训练10000次
		System.err.println(xorFnn);
		xorFnn.test();       // 测试
	}

	public static String getFileMD5(Path filePath) throws IOException {
		try (FileInputStream fis = new FileInputStream(filePath.toFile())) {
			// 使用 DigestUtils 直接计算 MD5
			return DigestUtils.md5Hex(fis);
		}
	}
	@Test
	void mnist() throws IOException {
		List<MnistLoader.MnistData> trainingData = mnistLoader.loadMnistData("classpath:/dataset/mnist/t10k-images-idx3-ubyte.zip",
				"classpath:/dataset/mnist/t10k-labels-idx1-ubyte.zip");
		var mnistViewer = new Window();

		ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor();
		System.out.println("测试数据加载完成，样本数量: " + trainingData.size());
		// 初始化并训练模型
		SimpleCNN simpleCNN = new SimpleCNN();
		try {
			simpleCNN.loadModel();
		}catch (Exception e){
			e.printStackTrace();
		}
		List<Mnist> mnistList = new ArrayList<>();
		// 注册训练回调
		simpleCNN.setTrainingCallbacks(new TrainingCallback() {
			@Override
			public void onEpochStart(int epoch, int totalEpochs) {
				System.out.printf("开始训练第 %d/%d 个 epoch%n", epoch, totalEpochs);
				if (epoch % 10 == 0 || epoch == totalEpochs) {
					// 保存模型
					executorService.submit(()-> {
						try {
							simpleCNN.saveModel();
							System.err.println(getFileMD5(Path.of(simpleCNN.getModelFilePath())));
						} catch (IOException e) {
							throw new RuntimeException(e);
						}
					});
				}
			}

			@Override
			public void onEpochEnd(int epoch, double averageLoss) {
				System.out.printf("完成训练第 %d 个 epoch，平均损失: %.4f%n", epoch, averageLoss);
			}
		});

		// 注册测试回调
		simpleCNN.setTestingCallbacks(new TestingCallback() {
			@Override
			public void onTestStart(int totalTests) {
				System.out.println("开始测试，总测试样本数: " + totalTests);
			}

            @Override
			public void onTestProgress(int currentTest, int totalTests, MnistLoader.MnistData sample, int targetLabel) {
				mnistList.add(new Mnist().test(targetLabel).pixels(sample.pixels()).label(sample.label()));
				System.out.printf("测试进度: %d/%d%n,测试标签:%d，期待标签:%s", currentTest, totalTests,targetLabel,sample.label());
			}

			@Override
			public void onTestEnd(double accuracy) {
				System.out.printf("测试完成，准确率: %.2f%%%n", accuracy * 100);
			}
		});

		int epochs = 2000; // 设置训练轮数
//		simpleCNN.train(trainingData, epochs,10);
		// 如果需要，可以加载模型
		// simpleCNN.loadModel();
		// 测试模型
		simpleCNN.test(trainingData);
		Window.mnistData = mnistList;
		mnistViewer.start();

	}
	@Test
	void mnist2() throws IOException {
		List<MnistLoader.MnistData> trainingData = mnistLoader.loadMnistData("classpath:/dataset/mnist/t10k-images-idx3-ubyte.zip",
				"classpath:/dataset/mnist/t10k-labels-idx1-ubyte.zip");
//		var mnistViewer = new Window();
		// 初始化神经网络
		NeuralNetwork network = new NeuralNetwork();
		// 添加卷积层：卷积核大小3x3，ReLU激活，步幅1，"same"填充
		network.addLayer(new ConvLayer(3, new ReLU(), 1, "same"));
		// 添加池化层：2x2池化窗口，步幅2
		network.addLayer(new PoolLayer(2, 2));
		// 添加全连接层：输入大小根据卷积和池化后的输出尺寸，输出大小10（分类数量），Softmax激活
		// 假设输入图像大小为28x28，经过"same"卷积和2x2池化，尺寸保持28x28 -> 14x14
		// 展平后为14*14=196
		network.addLayer(new FCLayer(14 * 14, 10, new Softmax()));

		// 训练参数
		int epochs = 10;
		double learningRate = 0.01;
		for(int epoch=1; epoch<=epochs; epoch++) {
			double totalLoss = 0.0;
			int correct = 0;
			for(MnistLoader.MnistData data : trainingData) {
				double[][] input = data.pixels(); // 输入图像
				int label = data.label();          // 真实标签

				// 将标签转换为One-Hot编码
				double[] oneHot = new double[10];
				oneHot[label] = 1.0;

				// 训练网络，获取当前样本的损失
				double loss = network.trainSample(input, oneHot, learningRate);
				totalLoss += loss;

				// 预测标签
				int predicted = network.predict(input);
				if(predicted == label) {
					correct++;
				}
			}
			double avgLoss = totalLoss / trainingData.size();
			double accuracy = (double) correct / trainingData.size() * 100;
			System.out.printf("Epoch %d/%d - Loss: %.4f - Accuracy: %.2f%%\n", epoch, epochs, avgLoss, accuracy);
		}
		// 加载训练好的权重（需要实现）
		// For simplicity, assuming network is already trained in memory

		// 测试循环
		int correct = 0;
		for(MnistLoader.MnistData data : trainingData) {
			double[][] input = data.pixels(); // 输入图像
			int label = data.label();          // 真实标签

			// 预测标签
			int predicted = network.predict(input);
			if(predicted == label) {
				correct++;
			}
		}
		double accuracy = (double) correct / trainingData.size() * 100;
		System.out.printf("Test Accuracy: %.2f%%\n", accuracy);
	}
}
