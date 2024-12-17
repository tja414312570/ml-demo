package com.example.java.cnn.callbacks;

public interface TrainingCallback {
    void onEpochStart(int epoch, int totalEpochs);
    void onEpochEnd(int epoch, double averageLoss);
}
