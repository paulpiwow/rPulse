package com.rpulse.backend.alarmadmin.controller;

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

import com.rpulse.backend.alarmadmin.entity.AppLicense;
import com.rpulse.backend.alarmadmin.repository.AppLicenseRepository;

/**
 * Handles all the web requests for customer licenses — the License Management and
 * Renewal Workflow screens. It lets the app list licenses, look one up, add a new
 * one, change one, and remove one. Every request is answered with the data as
 * plain text (JSON) the screens can read.
 *
 * <p>All the licenses are reached at web addresses starting with /api/licenses.
 * A license has no links to other records, so each one is sent back as-is.
 */
@RestController
@RequestMapping("/api/licenses")
public class AppLicenseController {

    private final AppLicenseRepository repository;

    // The app hands this controller the license "filing cabinet" to work with.
    public AppLicenseController(AppLicenseRepository repository) {
        this.repository = repository;
    }

    /** Asking for /api/licenses gives back the full list of licenses. */
    @GetMapping
    public List<AppLicense> list() {
        return repository.findAll();
    }

    /** Asking for /api/licenses/{id} gives back that one license, or a "not found" reply. */
    @GetMapping("/{id}")
    public ResponseEntity<AppLicense> getOne(@PathVariable Long id) {
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** Sending a new license to /api/licenses saves it and replies that it was created. */
    @PostMapping
    public ResponseEntity<AppLicense> create(@RequestBody AppLicense body) {
        AppLicense saved = repository.save(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Sending updated details to /api/licenses/{id} overwrites that license with the
     * new values. If no license with that id exists, it replies "not found".
     */
    @PutMapping("/{id}")
    public ResponseEntity<AppLicense> update(@PathVariable Long id,
                                             @RequestBody AppLicense body) {
        return repository.findById(id)
            .map(existing -> {
                existing.setCode(body.getCode());
                existing.setSiteId(body.getSiteId());
                existing.setCustomerName(body.getCustomerName());
                existing.setStatus(body.getStatus());
                existing.setStartDate(body.getStartDate());
                existing.setEndDate(body.getEndDate());
                existing.setRenewalStatus(body.getRenewalStatus());
                existing.setCustomerContact(body.getCustomerContact());
                existing.setRequestedTerm(body.getRequestedTerm());
                existing.setRenewalNote(body.getRenewalNote());
                return ResponseEntity.ok(repository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking to delete /api/licenses/{id} removes that license, or replies "not found". */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
