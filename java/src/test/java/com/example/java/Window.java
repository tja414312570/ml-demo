package com.example.java;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.scene.Scene;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.ListView;
import javafx.scene.image.ImageView;
import javafx.scene.image.PixelWriter;
import javafx.scene.image.WritableImage;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;
import javafx.stage.Stage;
import lombok.Data;
import lombok.Setter;
import lombok.experimental.Accessors;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Accessors(fluent = true)
class Mnist {
    double[][] pixels;
    int label;
    // 使用 -1 表示 test 值尚未计算
    int test = -1;
}

@Setter
public class Window extends Application {
    final int IMAGES_PER_ROW = 10; // 每行显示10张图像
    static List<Mnist> mnistData;

    @Override
    public void start(Stage primaryStage) {
        ListView<List<Mnist>> listView = new ListView<>();
        listView.setPrefWidth(1600);

        // 将 MNIST 数据分组，每组包含 IMAGES_PER_ROW 张图像
        List<List<Mnist>> groupedData = groupMnistData(mnistData, IMAGES_PER_ROW);
        listView.getItems().addAll(groupedData);

        // 设置自定义 ListCell
        listView.setCellFactory(item -> new MnistListCell());

        // 使用 BorderPane 作为根布局
        BorderPane root = new BorderPane();
        root.setCenter(listView);

        // 创建场景并设置到舞台
        Scene scene = new Scene(root, 1600, 800);
        primaryStage.setTitle("MNIST Viewer with Virtualized ListView");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private List<List<Mnist>> groupMnistData(List<Mnist> data, int groupSize) {
        List<List<Mnist>> groupedData = new ArrayList<>();
        for (int i = 0; i < data.size(); i += groupSize) {
            int end = Math.min(i + groupSize, data.size());
            groupedData.add(new ArrayList<>(data.subList(i, end)));
        }
        return groupedData;
    }

    public void start() {
        launch();
    }
}

class MnistListCell extends ListCell<List<Mnist>> {
    private final HBox hBox;
    private final Map<Mnist, ImageView> imageViewMap;
    private final Map<Mnist, Label> testLabelMap; // 保存每个Mnist对应的Test标签

    public MnistListCell() {
        super();
        hBox = new HBox(10); // 设置水平间距
        imageViewMap = new HashMap<>();
        testLabelMap = new HashMap<>();
    }

    @Override
    protected void updateItem(List<Mnist> items, boolean empty) {
        super.updateItem(items, empty);
        if (empty || items == null) {
            setGraphic(null);
        } else {
            hBox.getChildren().clear();
            for (Mnist data : items) {
                ImageView imageView = imageViewMap.get(data);
                if (imageView == null) {
                    imageView = new ImageView();
                    imageView.setFitWidth(140); // 放大倍数（28 * 5）
                    imageView.setFitHeight(140);
                    imageView.setPreserveRatio(true);
                    imageViewMap.put(data, imageView);

                    // 异步加载图像
                    Task<WritableImage> task = new Task<>() {
                        @Override
                        protected WritableImage call() {
                            return createImage(data.pixels());
                        }
                    };

                    ImageView finalImageView = imageView;
                    task.setOnSucceeded(event -> finalImageView.setImage(task.getValue()));
                    new Thread(task).start();
                }

                // 创建显示 label 与 test 的Label
                Label labelLabel = new Label("Label: " + data.label());

                Label testLabel = testLabelMap.get(data);
                if (testLabel == null) {
                    testLabel = new Label();
                    testLabelMap.put(data, testLabel);
                }
                updateTestLabel(data, testLabel);

                // 如果test还没计算，则异步计算
                if (data.test() == -1) {
                    // 模拟异步计算test值，这里你可以用真正的识别逻辑替换
                    Task<Integer> testTask = new Task<>() {
                        @Override
                        protected Integer call() throws Exception {
                            Thread.sleep(1000); // 模拟计算耗时
                            // 返回随机结果模拟识别结果
                            return (int)(Math.random() * 10);
                        }
                    };

                    Label finalTestLabel = testLabel;
                    testTask.setOnSucceeded(e -> {
                        data.test(testTask.getValue()); // 更新数据对象的 test 值
                        Platform.runLater(() -> {
                            updateTestLabel(data, finalTestLabel);
                        });
                    });

                    new Thread(testTask).start();
                }

                VBox imageBox = new VBox(5); // 设置垂直间距
                imageBox.getChildren().addAll(imageView, labelLabel, testLabel);
                hBox.getChildren().add(imageBox);
            }
            setGraphic(hBox);
        }
    }

    private void updateTestLabel(Mnist data, Label testLabel) {
        if (data.test() == -1) {
            testLabel.setText("Test: 加载中...");
        } else {
            testLabel.setText("Test: " + data.test());
        }
    }

    private WritableImage createImage(double[][] pixels) {
        int height = pixels.length;
        int width = pixels[0].length;
        WritableImage writableImage = new WritableImage(width, height);
        PixelWriter pixelWriter = writableImage.getPixelWriter();

        for (int row = 0; row < height; row++) {
            for (int col = 0; col < width; col++) {
                double gray = pixels[row][col];
                gray = Math.max(0, Math.min(1, gray)); // 确保灰度值在0-1之间
                Color color = new Color(gray, gray, gray, 1.0);
                pixelWriter.setColor(col, row, color);
            }
        }

        return writableImage;
    }
}
