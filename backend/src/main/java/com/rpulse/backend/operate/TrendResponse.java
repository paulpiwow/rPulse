package com.rpulse.backend.operate;

import java.util.List;

import com.rpulse.backend.influx.TrendPoint;

/**
 * A trend series for one tag/ctag over a window, for plotting.
 *
 * @param id       the tag/ctag code being plotted
 * @param duration the requested window token (1h/6h/24h/7d/14d)
 * @param points   time-ordered {timestamp, value} points from rTruth
 */
public record TrendResponse(String id, String duration, List<TrendPoint> points) {
}
