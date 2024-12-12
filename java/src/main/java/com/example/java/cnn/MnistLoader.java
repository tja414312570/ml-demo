package com.example.java.cnn;

import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@AllArgsConstructor
public class MnistLoader {
    private final ResourceLoader resourceLoader;
    public record MnistData(double[][] pixels, int label) {}
    InputStream getInputStream(ZipInputStream zipInputStream) throws IOException {
        ZipEntry nextEntry = zipInputStream.getNextEntry();
        return new BufferedInputStream(zipInputStream);
    }
    public List<MnistData> loadMnistData(String imagesPath,String labelsPath) throws IOException {
        var dataSet = new ArrayList<MnistData>();
        Resource imageResource = resourceLoader.getResource(labelsPath);
        DataInputStream labelStream = new DataInputStream(getInputStream(new ZipInputStream(imageResource.getInputStream())));
        int magicNumberLabels = labelStream.readInt();
        if(magicNumberLabels != 2049){
            labelStream.close();
            throw new IllegalArgumentException("Invalid magic number for labels!");
        }
        int numLabels = labelStream.readInt();
        Resource labelResource = resourceLoader.getResource(imagesPath);
        DataInputStream imageStream = new DataInputStream(getInputStream(new ZipInputStream(labelResource.getInputStream())));
        int magicNumberImages = imageStream.readInt();
        if (magicNumberImages != 2051) {
            imageStream.close();
            throw new IOException("Invalid magic number for images!");
        }
        int numImages = imageStream.readInt();
        int numRows = imageStream.readInt();
        int numCols = imageStream.readInt();
        if(numImages != numLabels){
            imageStream.close();
            labelStream.close();
            throw new IllegalArgumentException("Number of images does not match number of labels!");
        }
        for (int i = 0; i < numImages; i++) {
            int label = labelStream.readUnsignedByte();
            double[][] pixels = new double[numRows][numCols];
            for (int row = 0; row < numRows; row++) {
                for (int col = 0; col < numCols; col++) {
                    int pixel =imageStream.readUnsignedByte();
                    pixels[row][col] = pixel/255.0;
                }
            }
            dataSet.add(new MnistData(pixels, label));
        }
        imageStream.close();
        labelStream.close();
        return dataSet;
    }
}
