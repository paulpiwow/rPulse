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
 * <p>Base path: {@code /api/groups}. This is the reference pattern for the
 * alarm/admin controllers — the entity has no relationships, so entities are
 * returned directly as JSON without any special handling.
 */
@RestController
@RequestMapping("/api/groups")
public class NotificationGroupController {

    private final NotificationGroupRepository repository;

    // Spring injects the repository here (constructor injection).
    public NotificationGroupController(NotificationGroupRepository repository) {
        this.repository = repository;
    }

    /** GET /api/groups → list every group. */
    @GetMapping
    public List<NotificationGroup> list() {
        return repository.findAll();
    }

    /** GET /api/groups/{id} → one group, or 404 if it doesn't exist. */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationGroup> getOne(@PathVariable Long id) {
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/groups → create a group from the JSON body. Returns 201 Created. */
    @PostMapping
    public ResponseEntity<NotificationGroup> create(@RequestBody NotificationGroup body) {
        NotificationGroup saved = repository.save(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** PUT /api/groups/{id} → update an existing group, or 404 if it doesn't exist. */
    @PutMapping("/{id}")
    public ResponseEntity<NotificationGroup> update(@PathVariable Long id,
                                                    @RequestBody NotificationGroup body) {
        return repository.findById(id)
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

    /** DELETE /api/groups/{id} → remove a group. Returns 204 No Content, or 404. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
