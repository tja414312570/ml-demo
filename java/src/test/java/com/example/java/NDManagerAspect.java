package com.example.java;

import ai.djl.ndarray.NDManager;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolver;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class NDManagerAspect implements ParameterResolver {
    @Around("@annotation(WithNDManager)")
    public Object manageNDManager(ProceedingJoinPoint joinPoint) throws Throwable {
        try (NDManager manager = NDManager.newBaseManager()) {
            Object[] args = joinPoint.getArgs();
            for (int i = 0; i < args.length; i++) {
                if (args[i] instanceof NDManager) {
                    args[i] = manager;
                }
            }
            return joinPoint.proceed(args);
        }
    }

    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        // 判断参数类型是否是 NDManager
        return parameterContext.getParameter().getType().equals(NDManager.class);
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext) {
        // 返回 NDManager 实例
        return NDManager.newBaseManager(); // 或者根据需求自定义实例
    }
}
