package com.rpulse.backend.operate;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The Site Status screen — the Operator's daily landing view. Combines Postgres config, live
 * rTruth values and an inline alarm evaluation into one rollup.
 *
 * <p>Reached at /api/v1/site-status.
 */
@RestController
@RequestMapping("/site-status")
public class SiteStatusController {

    private final SiteStatusService siteStatus;

    public SiteStatusController(SiteStatusService siteStatus) {
        this.siteStatus = siteStatus;
    }

    @GetMapping
    public SiteStatusResponse get() {
        return siteStatus.build();
    }
}
