package com.rpulse.backend.alarmadmin.controller;

import java.time.OffsetDateTime;
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

import com.rpulse.backend.alarmadmin.entity.SystemMessage;
import com.rpulse.backend.alarmadmin.repository.SystemMessageRepository;

/**
 * Handles all the web requests for the Message Center — the in-app inbox. It lets the
 * app list messages, look one up, add one, change one, remove one, and (the common
 * action) mark one as read.
 *
 * <p>All of this is reached at web addresses starting with /api/messages.
 */
@RestController
@RequestMapping("/api/messages")
public class SystemMessageController {

    private final SystemMessageRepository repository;

    // The app hands this controller the message "filing cabinet" to work with.
    public SystemMessageController(SystemMessageRepository repository) {
        this.repository = repository;
    }

    /** Asking for /api/messages gives back the full list of messages. */
    @GetMapping
    public List<SystemMessage> list() {
        return repository.findAll();
    }

    /** Asking for /api/messages/{id} gives back that one message, or a "not found" reply. */
    @GetMapping("/{id}")
    public ResponseEntity<SystemMessage> getOne(@PathVariable Long id) {
        return repository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** Sending a new message to /api/messages saves it and replies that it was created. */
    @PostMapping
    public ResponseEntity<SystemMessage> create(@RequestBody SystemMessage body) {
        SystemMessage saved = repository.save(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Sending updated details to /api/messages/{id} overwrites that message with the new
     * values. If no message with that id exists, it replies "not found".
     */
    @PutMapping("/{id}")
    public ResponseEntity<SystemMessage> update(@PathVariable Long id,
                                                @RequestBody SystemMessage body) {
        return repository.findById(id)
            .map(existing -> {
                existing.setCode(body.getCode());
                existing.setTitle(body.getTitle());
                existing.setBody(body.getBody());
                existing.setTarget(body.getTarget());
                existing.setStatus(body.getStatus());
                return ResponseEntity.ok(repository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking to delete /api/messages/{id} removes that message, or replies "not found". */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marking a message as read: a request to /api/messages/{id}/acknowledge flips its
     * status to "Acknowledged" and stamps the time it happened. This is the button on the
     * Message Center screen. Replies "not found" if the message doesn't exist.
     */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<SystemMessage> acknowledge(@PathVariable Long id) {
        return repository.findById(id)
            .map(message -> {
                message.setStatus("Acknowledged");
                message.setAcknowledgedAt(OffsetDateTime.now());
                return ResponseEntity.ok(repository.save(message));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
