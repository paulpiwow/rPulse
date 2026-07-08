package com.rpulse.backend.influx;

import java.net.http.HttpClient;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({InfluxProperties.class, RTruthInfluxProperties.class,
        LocalInfluxProperties.class})
class InfluxConfiguration {

    @Bean
    @Qualifier("influxRestClient")
    RestClient influxRestClient(RestClient.Builder builder, InfluxProperties properties) {
        return build(builder, properties.url(), properties.token(), properties.connectTimeout(), properties.readTimeout());
    }

    @Bean
    @Qualifier("rtruthRestClient")
    RestClient rtruthRestClient(RestClient.Builder builder, RTruthInfluxProperties properties) {
        return build(builder, properties.url(), properties.token(), properties.connectTimeout(), properties.readTimeout());
    }

    @Bean
    @Qualifier("localInfluxRestClient")
    RestClient localInfluxRestClient(RestClient.Builder builder, LocalInfluxProperties properties) {
        return build(builder, properties.url(), properties.token(), properties.connectTimeout(), properties.readTimeout());
    }

    private static RestClient build(RestClient.Builder builder, java.net.URI url, String token,
                                    java.time.Duration connectTimeout, java.time.Duration readTimeout) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(readTimeout);

        RestClient.Builder configured = builder
                .baseUrl(url.toString())
                .requestFactory(requestFactory);

        if (token != null && !token.isBlank()) {
            configured.defaultHeader(HttpHeaders.AUTHORIZATION, "Token " + token);
        }

        return configured.build();
    }
}
