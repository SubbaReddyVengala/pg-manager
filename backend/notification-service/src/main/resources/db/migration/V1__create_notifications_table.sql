CREATE TABLE notification_schema.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255),
    tenant_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed some mock data for UI testing (as seen in Screenshot 2)
INSERT INTO notification_schema.notifications (title, message, type, recipient, tenant_id, is_read, created_at)
VALUES 
('Rent Overdue — Suresh Babu (Room 102)', 'Rs.8,500 is 5 days overdue. Last reminder sent on 2-Mar. Send another reminder?', 'OVERDUE', '919876543210', 101, FALSE, NOW() - INTERVAL '5 days'),
('New Maintenance Request — Room 101', 'Ravi Kumar reported: "AC not working". Ticket #MNT-042 created.', 'MAINTENANCE', NULL, 102, FALSE, NOW() - INTERVAL '2 days'),
('Payment Received — Priya Sharma', 'Rs.12,000 received via Cash for March 2026. Receipt #RCP-2026-0041 generated.', 'PAYMENT', 'priya@email.com', 103, FALSE, NOW() - INTERVAL '1 day'),
('Rent Due Reminder — 2 Tenants', 'Kavitha R (Room 103) and Kiran B (Room 104) rent due on 10-Mar. Auto-reminder scheduled.', 'REMINDER', NULL, NULL, FALSE, NOW()),
('Move-Out Completed — Meena Devi', 'Room 106 is now AVAILABLE. Deposit of Rs.17,000 refunded. No dues pending.', 'MOVE_OUT', 'meena@email.com', 106, FALSE, NOW() - INTERVAL '3 days');
