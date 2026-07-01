package com.rpulse.backend.hierarchy.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.hierarchy.entity.Site;
import com.rpulse.backend.hierarchy.repository.SiteRepository;

/**
 * CRUD endpoints for {@link Site}, the top of the asset hierarchy. Talks to the
 * repository directly — there is no domain logic beyond persistence yet, so a
 * service layer is intentionally omitted.
 *
 * <p>A single site is addressed by its human {@code code} (e.g. "SITE-1"), matching the
 * rest of the API's resource-by-code contract.
 */
@RestController
@RequestMapping("/sites")
public class SiteController {

    private final SiteRepository sites;

    public SiteController(SiteRepository sites) {
        this.sites = sites;
    }

    @GetMapping
    public List<Site> list() {
        return sites.findAll();
    }

    @GetMapping("/{code}")
    public ResponseEntity<Site> get(@PathVariable String code) {
        return sites.findByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Site> create(@RequestBody Site site) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sites.save(site));
    }

    @PutMapping("/{code}")
    public ResponseEntity<Site> update(@PathVariable String code, @RequestBody Site body) {
        return sites.findByCode(code).map(existing -> {
            existing.setCode(body.getCode());
            existing.setSiteName(body.getSiteName());
            existing.setLocation(body.getLocation());
            existing.setCustomerName(body.getCustomerName());
            existing.setDescription(body.getDescription());
            return ResponseEntity.ok(sites.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return sites.findByCode(code).map(site -> {
            sites.delete(site);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
