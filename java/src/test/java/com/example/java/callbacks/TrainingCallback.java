package com.example.java.callbacks;

public interface TrainingCallback {
    void onEpochStart(int epoch, int totalEpochs);
    void onEpochEnd(int epoch, double averageLoss);
}
