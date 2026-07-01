package com.rpulse.backend.operate;

import java.time.Duration;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.rpulse.backend.hierarchy.repository.CTagRepository;
import com.rpulse.backend.hierarchy.repository.TagRepository;
import com.rpulse.backend.influx.RTruthConnector;

/**
 * Trend charts (shared across screens). Returns time-series points from rTruth for one tag
 * or ctag over a window. Because the scheduler persists computed ctags to Influx as synthetic
 * tags, a ctag reads back exactly like a raw tag — same query path.
 *
 * <p>Reached at web addresses starting with /api/v1/trends.
 */
@RestController
@RequestMapping("/trends")
public class TrendController {

    private final TagRepository tags;
    private final CTagRepository ctags;
    private final RTruthConnector connector;

    public TrendController(TagRepository tags, CTagRepository ctags, RTruthConnector connector) {
        this.tags = tags;
        this.ctags = ctags;
        this.connector = connector;
    }

    /** Trend for one raw tag. {@code tagId} is the tag code; {@code duration} is 1h/6h/24h/7d/14d. */
    @GetMapping("/tag/{tagId}")
    public TrendResponse tagTrend(@PathVariable String tagId,
                                  @RequestParam(defaultValue = "24h") String duration) {
        if (tags.findByCode(tagId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No tag " + tagId);
        }
        return series(tagId, duration);
    }

    /** Trend for one computed tag (ctag). {@code ctagId} is the ctag code. */
    @GetMapping("/ctag/{ctagId}")
    public TrendResponse ctagTrend(@PathVariable String ctagId,
                                   @RequestParam(defaultValue = "24h") String duration) {
        if (ctags.findByCode(ctagId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No ctag " + ctagId);
        }
        return series(ctagId, duration);
    }

    private TrendResponse series(String key, String duration) {
        return new TrendResponse(key, duration, connector.getTrend(key, window(duration)));
    }

    /** Map a duration token to a window; reject anything unexpected with 400. */
    private static Duration window(String duration) {
        return switch (duration) {
            case "1h" -> Duration.ofHours(1);
            case "6h" -> Duration.ofHours(6);
            case "24h" -> Duration.ofHours(24);
            case "7d" -> Duration.ofDays(7);
            case "14d" -> Duration.ofDays(14);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "duration must be one of 1h,6h,24h,7d,14d");
        };
    }
}
