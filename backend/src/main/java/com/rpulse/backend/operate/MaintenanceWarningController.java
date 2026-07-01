package com.rpulse.backend.operate;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rpulse.backend.alarmadmin.entity.NotificationGroup;
import com.rpulse.backend.alarmadmin.entity.SystemMessage;
import com.rpulse.backend.alarmadmin.repository.NotificationGroupRepository;
import com.rpulse.backend.alarmadmin.repository.SystemMessageRepository;

/**
 * The Maintenance Warnings screen — tags reading outside their baseline range. Listing is a
 * pure read (Postgres baselines + live Influx values); the only write is the explicit
 * <em>Notify</em> action, which is the single way a maintenance warning turns into a Message.
 *
 * <p>Reached at web addresses starting with /api/v1/maintenance-warnings.
 */
@RestController
@RequestMapping("/maintenance-warnings")
public class MaintenanceWarningController {

    private final MaintenanceService maintenance;
    private final NotificationGroupRepository groups;
    private final SystemMessageRepository messages;

    public MaintenanceWarningController(MaintenanceService maintenance,
                                        NotificationGroupRepository groups,
                                        SystemMessageRepository messages) {
        this.maintenance = maintenance;
        this.groups = groups;
        this.messages = messages;
    }

    /** Tags/ctags currently above or below their baseline range. */
    @GetMapping
    public List<MaintenanceWarning> list() {
        return maintenance.evaluate();
    }

    /**
     * Notify a group about a deviation on {@code tagId} (a tag/ctag code). Writes the one and
     * only Message a maintenance warning ever produces, with {@code source=MAINTENANCE_WARNING}.
     * The body's {@code groupId} is the target group's code.
     */
    @PostMapping("/{tagId}/notify")
    public ResponseEntity<SystemMessage> notify(@PathVariable String tagId,
                                                @RequestBody(required = false) NotifyRequest body) {
        String groupName = null;
        if (body != null && body.groupId() != null) {
            groupName = groups.findByCode(body.groupId())
                    .map(NotificationGroup::getGroupName)
                    .orElse(body.groupId());
        }
        SystemMessage message = new SystemMessage();
        message.setCode("MSG-" + UUID.randomUUID());
        message.setTitle("Maintenance warning: " + tagId);
        message.setBody("Deviation flagged for " + tagId
                + (groupName != null ? "; notifying " + groupName : "") + ".");
        message.setSource("MAINTENANCE_WARNING");
        message.setTarget(groupName);
        message.setStatus("Unread");
        return ResponseEntity.status(HttpStatus.CREATED).body(messages.save(message));
    }

    /** Notify request body: the target group's code. */
    public record NotifyRequest(String groupId) {
    }
}
