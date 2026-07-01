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
 */
@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteRepository sites;

    public SiteController(SiteRepository sites) {
        this.sites = sites;
    }

    @GetMapping
    public List<Site> list() {
        return sites.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> get(@PathVariable Long id) {
        return sites.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Site> create(@RequestBody Site site) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sites.save(site));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Site> update(@PathVariable Long id, @RequestBody Site body) {
        return sites.findById(id).map(existing -> {
            existing.setCode(body.getCode());
            existing.setSiteName(body.getSiteName());
            existing.setLocation(body.getLocation());
            existing.setCustomerName(body.getCustomerName());
            existing.setDescription(body.getDescription());
            return ResponseEntity.ok(sites.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!sites.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sites.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
