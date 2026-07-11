package com.rpulse.backend.influx;

/** Where Stage 1 should write computed CTag points. */
enum StageOneCtagDestination {
    LOCAL,
    RTRUTH;

    static StageOneCtagDestination from(String value) {
        if (value == null || value.isBlank()) return LOCAL;
        return switch (value.trim().toLowerCase()) {
            case "local", "local-influx", "rpulse" -> LOCAL;
            case "rtruth", "historian" -> RTRUTH;
            default -> throw new IllegalArgumentException(
                    "rpulse.stage1.ctag-destination must be local or rtruth");
        };
    }
}
