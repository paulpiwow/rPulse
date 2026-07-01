package com.rpulse.backend.web;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * A stable JSON envelope for paginated list endpoints ({@code ?page=N&size=M}). We return
 * this instead of a raw Spring {@code Page} because serializing {@code PageImpl} directly is
 * unstable across versions (Spring even warns about it).
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}
