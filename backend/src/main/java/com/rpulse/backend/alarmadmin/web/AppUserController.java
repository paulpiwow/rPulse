package com.rpulse.backend.alarmadmin.web;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.AppUser;
import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.repository.AppUserRepository;
import com.rpulse.backend.alarmadmin.repository.NotificationGroupRepository;

/**
 * Handles all the web requests for users — the User Admin list and Edit User form.
 * It lets the app list users, look one up, add a new one, change one, and remove one.
 *
 * <p>It also handles which groups a user belongs to (the "membership" requests near
 * the bottom). That belongs here because it's about a user, but the membership is
 * stored in a separate connector table, so it gets its own requests rather than
 * being part of the plain user data.
 *
 * <p>All of this is reached at web addresses starting with /api/v1/users.
 */
@RestController
@RequestMapping("/users")
public class AppUserController {

    private final AppUserRepository userRepository;
    private final NotificationGroupRepository groupRepository;

    // The app hands this controller both the user and the group "filing cabinets":
    // the group one is needed to look up groups when changing a user's membership.
    public AppUserController(AppUserRepository userRepository,
                            NotificationGroupRepository groupRepository) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    /** Asking for /api/v1/users gives back the full list of users. */
    @GetMapping
    public List<AppUser> list() {
        return userRepository.findAll();
    }

    /** Asking for /api/v1/users/{id} gives back that one user, or a "not found" reply. */
    @GetMapping("/{id}")
    public ResponseEntity<AppUser> getOne(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** Sending a new user to /api/v1/users saves it and replies that it was created. */
    @PostMapping
    public ResponseEntity<AppUser> create(@RequestBody AppUser body) {
        AppUser saved = userRepository.save(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Sending updated details to /api/v1/users/{id} overwrites that user with the new
     * values. If no user with that id exists, it replies "not found". Group membership
     * is left alone here — it's changed through the membership requests below.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AppUser> update(@PathVariable Long id, @RequestBody AppUser body) {
        return userRepository.findById(id)
            .map(existing -> {
                existing.setCode(body.getCode());
                existing.setUserName(body.getUserName());
                existing.setEmail(body.getEmail());
                existing.setPhone(body.getPhone());
                existing.setRole(body.getRole());
                existing.setActive(body.isActive());
                existing.setNotificationPrefs(body.getNotificationPrefs());
                existing.setEmailNotifications(body.isEmailNotifications());
                existing.setSmsNotifications(body.isSmsNotifications());
                return ResponseEntity.ok(userRepository.save(existing));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    /** Asking to delete /api/v1/users/{id} removes that user, or replies "not found". */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // -----------------------------------------------------------------------
    // Group membership — which groups this user belongs to.
    // -----------------------------------------------------------------------

    /**
     * Asking for /api/v1/users/{id}/groups gives back the groups this user is in.
     * Marked "transactional" so the connection to the database stays open while we
     * gather the group list, since that list is loaded only when we ask for it.
     */
    @GetMapping("/{id}/groups")
    @Transactional(readOnly = true)
    public ResponseEntity<Set<NotificationGroup>> listGroups(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> ResponseEntity.<Set<NotificationGroup>>ok(new HashSet<>(user.getGroups())))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Sending a list of group ids to /api/v1/users/{id}/groups sets exactly which groups
     * the user belongs to (replacing whatever was there before). Returns the updated
     * group list, or "not found" if the user doesn't exist.
     */
    @PutMapping("/{id}/groups")
    @Transactional
    public ResponseEntity<Set<NotificationGroup>> setGroups(@PathVariable Long id,
                                                            @RequestBody List<Long> groupIds) {
        return userRepository.findById(id)
            .map(user -> {
                Set<NotificationGroup> groups = new HashSet<>(groupRepository.findAllById(groupIds));
                user.setGroups(groups);
                userRepository.save(user);
                return ResponseEntity.ok(groups);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
