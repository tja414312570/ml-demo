package com.example.java;

import com.example.java.cnn.MnistLoader;
import com.example.java.fnn.XorFnn;
import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.control.ScrollPane;
import javafx.scene.image.ImageView;
import javafx.scene.image.PixelWriter;
import javafx.scene.image.WritableImage;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.TilePane;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import javafx.util.Callback;
import lombok.Setter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
	@Setter
	public static class Window extends Application{
		private static final int IMAGES_PER_ROW = 10; // 每行显示10张图像
		static List<MnistLoader.MnistData> mnistData;
		@Override
		public void start(Stage primaryStage) throws Exception {
			ListView<List<MnistLoader.MnistData>> listView = new ListView<>();
			listView.setPrefWidth(1600); // 根据需要调整宽度

			// 将 MNIST 数据分组，每组包含 IMAGES_PER_ROW 张图像
			List<List<MnistLoader.MnistData>> groupedData = groupMnistData(mnistData, IMAGES_PER_ROW);
			listView.getItems().addAll(groupedData);

			// 设置自定义 ListCell
			listView.setCellFactory(_ -> new MnistListCell());

			// 使用 BorderPane 作为根布局
			BorderPane root = new BorderPane();
			root.setCenter(listView);

			// 创建场景并设置到舞台
			Scene scene = new Scene(root, 1600, 800); // 调整宽度和高度以适应需求
			primaryStage.setTitle("MNIST Viewer with Virtualized ListView");
			primaryStage.setScene(scene);
			primaryStage.show();
		}

		private List<List<MnistLoader.MnistData>> groupMnistData(List<MnistLoader.MnistData> data, int groupSize) {
			List<List<MnistLoader.MnistData>> groupedData = new ArrayList<>();
			for (int i = 0; i < data.size(); i += groupSize) {
				int end = Math.min(i + groupSize, data.size());
				groupedData.add(new ArrayList<>(data.subList(i, end)));
			}
			return groupedData;
		}
		public void start(){
			launch();
		}
	}
	@Test
	void mnist() throws IOException {
		List<MnistLoader.MnistData> mnistData = mnistLoader.loadMnistData("classpath:/dataset/mnist/t10k-images-idx3-ubyte.zip",
				"classpath:/dataset/mnist/t10k-labels-idx1-ubyte.zip");
		var mnistViewer = new Window();
		Window.mnistData = mnistData;
		System.err.println(mnistData);
		SimpleCNN.trans(mnistData);
		mnistViewer.start();

	}

}
