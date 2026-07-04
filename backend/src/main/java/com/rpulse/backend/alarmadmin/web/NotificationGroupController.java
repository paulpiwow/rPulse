package com.rpulse.backend.alarmadmin.web;

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

import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.repository.NotificationGroupRepository;

/**
 * REST endpoints for notification groups — the Group List / Group Configuration
 * screens. Standard CRUD over the {@link NotificationGroup} entity; all data
 * access goes through {@link NotificationGroupRepository}.
 *
 * <p>Base path: {@code /api/v1/groups}. This is the reference pattern for the
 * alarm/admin controllers — the entity has no relationships, so entities are
 * returned directly as JSON without any special handling.
 */
@RestController
@RequestMapping("/groups")
public class NotificationGroupController {

    private final NotificationGroupRepository repository;

    // Spring injects the repository here (constructor injection).
    public NotificationGroupController(NotificationGroupRepository repository) {
        this.repository = repository;
    }

    /** GET /api/v1/groups → list every group. */
    @GetMapping
    public List<NotificationGroup> list() {
        return repository.findAll();
    }

    /** GET /api/v1/groups/{code} → one group, or 404 if it doesn't exist. */
    @GetMapping("/{code}")
    public ResponseEntity<NotificationGroup> getOne(@PathVariable String code) {
        return repository.findByCode(code)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/v1/groups → create a group from the JSON body. Returns 201 Created. */
    @PostMapping
    public ResponseEntity<NotificationGroup> create(@RequestBody NotificationGroup body) {
        NotificationGroup saved = repository.save(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** PUT /api/v1/groups/{code} → update an existing group, or 404 if it doesn't exist. */
    @PutMapping("/{code}")
    public ResponseEntity<NotificationGroup> update(@PathVariable String code,
                                                    @RequestBody NotificationGroup body) {
        return repository.findByCode(code)
            .map(existing -> {
                existing.setCode(body.getCode());
                existing.setGroupName(body.getGroupName());
                existing.setPurpose(body.getPurpose());
                existing.setDelivery(body.getDelivery());
                existing.setActive(body.isActive());
                existing.setNotes(body.getNotes());
                return ResponseEntity.ok(repository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/v1/groups/{code} → remove a group. Returns 204 No Content, or 404. */
    @DeleteMapping("/{code}")
    public ResponseEntity<Void> delete(@PathVariable String code) {
        return repository.findByCode(code)
            .map(group -> {
                repository.delete(group);
                return ResponseEntity.noContent().<Void>build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
