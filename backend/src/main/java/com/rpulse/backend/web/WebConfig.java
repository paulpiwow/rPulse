package com.rpulse.backend.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration. Prefixes every API controller with {@code /api/v1} so the
 * version lives in one place instead of being repeated in each {@code @RequestMapping}.
 *
 * <p>The prefix is applied only to controllers under the feature packages, which keeps
 * the root {@link HealthController} (mapped to {@code /}) unversioned.
 *
 * <p>It also opens CORS for the Vue dev/preview server so the browser front end can call the
 * API cross-origin. The origins are the Vite preview ({@code :4173}) and dev ({@code :5173})
 * servers on both {@code localhost} and {@code 127.0.0.1}; tighten or externalise these before
 * production.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix("/api/v1", HandlerTypePredicate.forBasePackage(
                "com.rpulse.backend.influx",
                "com.rpulse.backend.hierarchy",
                "com.rpulse.backend.alarmadmin",
                "com.rpulse.backend.operate"));
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:4173", "http://127.0.0.1:4173",
                        "http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
