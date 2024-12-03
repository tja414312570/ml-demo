#pip install opencv-python-headless numpy mss ultralytics PyQt5
import cv2
import numpy as np
import time
import mss
from PyQt5.QtWidgets import QApplication, QLabel
from PyQt5.QtGui import QImage, QPixmap
from PyQt5.QtCore import Qt
from ultralytics import YOLO

# 加载 YOLOv8 模型
model = YOLO('yolo11n.pt')  # 替换为您的自定义模型路径

# 捕获屏幕图像
def capture_screen():
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # 主显示器
        screenshot = sct.grab(monitor)
        img = np.array(screenshot)
        return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

# 在图像上绘制检测框和标签
def draw_boxes(img, results):
    for result in results:
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # 坐标
            conf = box.conf[0]  # 置信度
            cls = int(box.cls[0])  # 类别索引
            label = f"{model.names[cls]} {conf:.2f}"  # 类别名 + 置信度

            # 绘制边框和标签
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return img

# 创建 PyQt5 窗口类
class TransparentWindow(QLabel):
    def __init__(self):
        super().__init__()
        self.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)  # 置顶 + 无边框
        self.setAttribute(Qt.WA_TranslucentBackground)  # 透明背景
        self.setWindowFlag(Qt.Window)  # 普通窗口类型
        self.showFullScreen()  # 全屏

    def update_image(self, frame):
        # 将 OpenCV 图像转换为 Qt 图像
        height, width, channel = frame.shape
        bytes_per_line = 3 * width
        qt_image = QImage(frame.data, width, height, bytes_per_line, QImage.Format_RGB888)
        self.setPixmap(QPixmap.fromImage(qt_image))

# 主循环
def main():
    app = QApplication([])  # 创建 PyQt 应用
    window = TransparentWindow()  # 创建透明窗口

    while True:
        start_time = time.time()

        # 捕获桌面图像
        img = capture_screen()

        # 目标检测
        results = model(img, verbose=False)

        # 绘制检测框
        img = draw_boxes(img, results)

        # 计算 FPS
        end_time = time.time()
        fps = 1 / (end_time - start_time)
        fps_text = f"FPS: {fps:.2f}"
        cv2.putText(img, fps_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

        # 更新窗口图像
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # 转为 RGB
        window.update_image(img)

        app.processEvents()  # 处理事件循环

if __name__ == "__main__":
    main()
