package com.example.java.callbacks;

public interface TestingCallback {
    void onTestStart(int totalTests);
    void onTestProgress(int currentTest, int totalTests);
    void onTestEnd(double accuracy);
}
