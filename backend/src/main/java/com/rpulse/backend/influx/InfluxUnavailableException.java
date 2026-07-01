package com.rpulse.backend.influx;

public class InfluxUnavailableException extends RuntimeException {

    public InfluxUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
