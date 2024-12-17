package com.example.java;

import ai.djl.ndarray.NDArray;
import ai.djl.ndarray.NDManager;
import ai.djl.ndarray.types.DataType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import tech.tablesaw.plotly.components.Axis;
import tech.tablesaw.plotly.components.Figure;
import tech.tablesaw.plotly.components.Layout;
import tech.tablesaw.plotly.traces.ScatterTrace;

import java.util.function.Function;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class SimpleTest {
    @Test
    public void test(){
        try(NDManager manager = NDManager.newBaseManager()){
            NDArray x = manager.arange(12);
            System.err.println(x.getShape());
        }
    }

    @Bean
    public NDManager ndManager(){
        return  NDManager.newBaseManager();
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

    @Test
    void plotTest(@Autowired NDManager manager){
        Function<Double, Double> f = x -> (3 * Math.pow(x, 2) -4 * x);
            NDArray X = manager.arange(0f, 3f, 0.1f, DataType.FLOAT64);
            double[] x = X.toDoubleArray();

            double[] fx = new double[x.length];
            for (int i = 0; i < x.length; i++) {
                fx[i] = f.apply(x[i]);
            }


            double[] fg = new double[x.length];
            for (int i = 0; i < x.length; i++) {
                fg[i] = 2 * x[i] - 3;
            }

            Figure figure = plotLineAndSegment(x, fx, fg, "f(x)", "Tangent line(x=1)", "x", "f(x)", 700, 500);
    }
    public Figure plotLineAndSegment(double[] x, double[] y, double[] segment,
                                     String trace1Name, String trace2Name,
                                     String xLabel, String yLabel,
                                     int width, int height) {
        ScatterTrace trace = ScatterTrace.builder(x, y)
                .mode(ScatterTrace.Mode.LINE)
                .name(trace1Name)
                .build();

        ScatterTrace trace2 = ScatterTrace.builder(x, segment)
                .mode(ScatterTrace.Mode.LINE)
                .name(trace2Name)
                .build();

        Layout layout = Layout.builder()
                .height(height)
                .width(width)
                .showLegend(true)
                .xAxis(Axis.builder().title(xLabel).build())
                .yAxis(Axis.builder().title(yLabel).build())
                .build();

        return new Figure(layout, trace, trace2);
    }
}
