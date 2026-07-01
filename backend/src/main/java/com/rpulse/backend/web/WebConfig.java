package com.rpulse.backend.web;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration. Prefixes every API controller with {@code /api/v1} so the
 * version lives in one place instead of being repeated in each {@code @RequestMapping}.
 *
 * <p>The prefix is applied only to controllers under the feature packages, which keeps
 * the root {@link HealthController} (mapped to {@code /}) unversioned.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix("/api/v1", HandlerTypePredicate.forBasePackage(
                "com.rpulse.backend.influx",
                "com.rpulse.backend.hierarchy",
                "com.rpulse.backend.alarmadmin"));
    }
}
