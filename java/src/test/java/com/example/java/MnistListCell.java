package com.example.java;
import com.example.java.cnn.MnistLoader;
import javafx.concurrent.Task;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.image.ImageView;
import javafx.scene.image.WritableImage;
import javafx.scene.image.PixelWriter;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.paint.Color;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class MnistListCell extends ListCell<List<MnistLoader.MnistData>> {
    private final HBox hBox;
    private final Map<MnistLoader.MnistData, ImageView> imageViewMap;

    public MnistListCell() {
        super();
        hBox = new HBox(10); // 设置水平间距
        imageViewMap = new HashMap<>();
    }

    @Override
    protected void updateItem(List<MnistLoader.MnistData> items, boolean empty) {
        super.updateItem(items, empty);
        if (empty || items == null) {
            setGraphic(null);
        } else {
            hBox.getChildren().clear();
            for (MnistLoader.MnistData data : items) {
                ImageView imageView = imageViewMap.get(data);
                if (imageView == null) {
                    imageView = new ImageView();
                    imageView.setFitWidth(140); // 放大倍数（28 * 5）
                    imageView.setFitHeight(140);
                    imageView.setPreserveRatio(true);
                    imageViewMap.put(data, imageView);

                    // 异步加载图像
                    Task<WritableImage> task = new Task<WritableImage>() {
                        @Override
                        protected WritableImage call() throws Exception {
                            return createImage(data.pixels());
                        }
                    };

                    ImageView finalImageView = imageView;
                    task.setOnSucceeded(event -> {
                        finalImageView.setImage(task.getValue());
                    });

                    new Thread(task).start();
                }
                VBox imageBox = new VBox(5); // 设置垂直间距
                imageBox.getChildren().addAll(imageView, new Label("Label: " + data.label()));
                hBox.getChildren().add(imageBox);
            }
            setGraphic(hBox);
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
                gray = Math.max(0, Math.min(1, gray)); // 确保灰度值在 0-1 之间
                Color color = new Color(gray, gray, gray, 1.0);
                pixelWriter.setColor(col, row, color);
            }
        }

        return writableImage;
    }
}
