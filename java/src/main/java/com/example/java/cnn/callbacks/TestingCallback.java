package com.example.java.cnn.callbacks;

import com.example.java.cnn.MnistLoader;

public interface TestingCallback {
    void onTestStart(int totalTests);
    void onTestEnd(double accuracy);
    void onTestProgress(int finalCurrentTest, int total, MnistLoader.MnistData sample, int targetLabel);
}
