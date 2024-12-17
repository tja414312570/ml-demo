package com.example.java;

import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDManager;
import org.junit.jupiter.api.Test;

public class SimpleTest {
    @Test
    public void test(){
        try(NDManager manager = NDManager.newBaseManager()){
            NDArray x = manager.arange(12);
            System.err.println(x.getShape());
        }
    }

    @Test
    void test1(){
        try(NDManager manager = NDManager.newBaseManager()){
            NDArray X = manager.arange(24f).reshape(2, 3, 4);
            System.err.println(  X);
            NDArray A = manager.arange(20f).reshape(5,4);
            NDArray B = A.duplicate(); // 通过分配新内存，将A的一个副本分配给B
            System.err.println(A.mul(B));
        }

    }
    @Test
    void sum(){
        try(NDManager manager = NDManager.newBaseManager()){
            NDArray A = manager.arange(20f).reshape(5,4);
            System.err.println( A);
            NDArray ASumAxis0 = A.sum(new int[] {1});
            System.err.println(  ASumAxis0);
        }

    }
}
