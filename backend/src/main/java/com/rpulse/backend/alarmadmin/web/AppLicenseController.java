package com.rpulse.backend.alarmadmin.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.AppLicense;
import com.rpulse.backend.alarmadmin.repository.AppLicenseRepository;

/**
 * Handles the web requests for the install's license — the License Management and
 * Renewal Workflow screens. The license is a <em>singleton</em>: there is exactly one
 * row per install, so it has no id in its address. The app can read it and overwrite it.
 *
 * <p>Reached at /api/v1/license. There is no collection and no create/delete — the row is
 * seeded at install time, so {@code PUT} simply overwrites whatever is there (and creates
 * the row the first time if the install has none yet).
 */
@RestController
@RequestMapping("/license")
public class AppLicenseController {

    private final AppLicenseRepository repository;

    // The app hands this controller the license "filing cabinet" to work with.
    public AppLicenseController(AppLicenseRepository repository) {
        this.repository = repository;
    }

    /**
     * Asking for /api/v1/license gives back the one license for this install, or a
     * "not found" reply if none has been set up yet.
     */
    @GetMapping
    public ResponseEntity<AppLicense> get() {
        return repository.findAll().stream().findFirst()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Sending updated details to /api/v1/license overwrites the install's license with
     * the new values. If the install has no license row yet, the values are saved as the
     * new (and only) one.
     */
    @PutMapping
    public ResponseEntity<AppLicense> update(@RequestBody AppLicense body) {
        AppLicense license = repository.findAll().stream().findFirst().orElseGet(AppLicense::new);
        license.setCode(body.getCode());
        license.setSiteId(body.getSiteId());
        license.setCustomerName(body.getCustomerName());
        license.setStatus(body.getStatus());
        license.setStartDate(body.getStartDate());
        license.setEndDate(body.getEndDate());
        license.setRenewalStatus(body.getRenewalStatus());
        license.setCustomerContact(body.getCustomerContact());
        license.setRequestedTerm(body.getRequestedTerm());
        license.setRenewalNote(body.getRenewalNote());
        return ResponseEntity.ok(repository.save(license));
    }
}
