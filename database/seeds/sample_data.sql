-- Sample Seed Data for DRRMO System

-- Insert sample barangays
INSERT INTO barangays (name, municipality, province, population, risk_level) VALUES
('Barangay Centro', 'Sample City', 'Sample Province', 5000, 'medium'),
('Barangay Riverside', 'Sample City', 'Sample Province', 3200, 'high'),
('Barangay Hillside', 'Sample City', 'Sample Province', 2800, 'low'),
('Barangay Coastal', 'Sample City', 'Sample Province', 4100, 'critical');

-- Insert sample users (passwords are hashed - in real app use proper hashing)
-- Note: In production, use proper password hashing
INSERT INTO users (email, password_hash, first_name, last_name, role, phone, barangay_id) VALUES
('admin@drmmo.gov.ph', '$2b$10$hashedpassword1', 'System', 'Administrator', 'admin', '+63-912-345-6789', NULL),
('officer1@drmmo.gov.ph', '$2b$10$hashedpassword2', 'Juan', 'Dela Cruz', 'drrmo_officer', '+63-912-345-6790', NULL),
('responder1@drmmo.gov.ph', '$2b$10$hashedpassword3', 'Maria', 'Santos', 'responder', '+63-912-345-6791', NULL),
('barangay1@drmmo.gov.ph', '$2b$10$hashedpassword4', 'Pedro', 'Garcia', 'barangay_official', '+63-912-345-6792', (SELECT id FROM barangays WHERE name = 'Barangay Centro')),
('citizen1@email.com', '$2b$10$hashedpassword5', 'Ana', 'Reyes', 'citizen', '+63-912-345-6793', (SELECT id FROM barangays WHERE name = 'Barangay Centro'));

-- Insert sample responders
INSERT INTO responders (user_id, team_name, specialization, vehicle_type, vehicle_plate) VALUES
((SELECT id FROM users WHERE email = 'responder1@drmmo.gov.ph'), 'Rapid Response Team Alpha', 'fire_rescue', 'Fire Truck', 'ABC-123'),
((SELECT id FROM users WHERE email = 'responder1@drmmo.gov.ph'), 'Medical Response Team', 'medical', 'Ambulance', 'MED-456');

-- Insert sample evacuation centers
INSERT INTO evacuation_centers (name, address, barangay_id, capacity, facilities, contact_person, contact_phone) VALUES
('Central Elementary School', '123 Main St, Barangay Centro', (SELECT id FROM barangays WHERE name = 'Barangay Centro'), 500, ARRAY['beds', 'kitchen', 'medical_station'], 'Principal Cruz', '+63-912-345-6794'),
('Community Hall Riverside', '456 River Rd, Barangay Riverside', (SELECT id FROM barangays WHERE name = 'Barangay Riverside'), 300, ARRAY['beds', 'kitchen'], 'Barangay Captain Santos', '+63-912-345-6795');

-- Insert sample resources
INSERT INTO resources (name, type, category, quantity, unit, status) VALUES
('Fire Extinguishers', 'equipment', 'firefighting', 25, 'pieces', 'available'),
('Medical Kits', 'supplies', 'medical', 15, 'kits', 'available'),
('Water Bottles', 'supplies', 'relief', 1000, 'bottles', 'available'),
('Blankets', 'supplies', 'shelter', 200, 'pieces', 'available');

-- Insert sample incidents
INSERT INTO incidents (title, description, type, severity, status, address, barangay_id, reported_by) VALUES
('Flooding in Riverside Area', 'Heavy flooding affecting multiple houses in Barangay Riverside', 'flood', 'high', 'responding', 'Riverside Area, Barangay Riverside', (SELECT id FROM barangays WHERE name = 'Barangay Riverside'), (SELECT id FROM users WHERE email = 'barangay1@drmmo.gov.ph')),
('Medical Emergency', 'Elderly person needs immediate medical attention', 'medical', 'critical', 'resolved', '123 Oak St, Barangay Centro', (SELECT id FROM barangays WHERE name = 'Barangay Centro'), (SELECT id FROM users WHERE email = 'citizen1@email.com'));

-- Insert sample emergency requests
INSERT INTO emergency_requests (user_id, type, description, address, barangay_id, priority) VALUES
((SELECT id FROM users WHERE email = 'citizen1@email.com'), 'medical', 'Heart attack emergency', '456 Elm St, Barangay Centro', (SELECT id FROM barangays WHERE name = 'Barangay Centro'), 'critical'),
((SELECT id FROM users WHERE email = 'citizen1@email.com'), 'fire', 'House fire reported', '789 Pine St, Barangay Riverside', (SELECT id FROM barangays WHERE name = 'Barangay Riverside'), 'high');

-- Insert sample notifications
INSERT INTO notifications (title, message, type, priority, target_audience, sent_by) VALUES
('Flood Warning', 'Heavy rains expected. Prepare for possible flooding in low-lying areas.', 'warning', 'high', 'all', (SELECT id FROM users WHERE email = 'officer1@drmmo.gov.ph')),
('Evacuation Notice', 'Immediate evacuation required for Barangay Riverside due to rising water levels.', 'emergency', 'critical', 'barangay', (SELECT id FROM users WHERE email = 'officer1@drmmo.gov.ph'));

-- Insert sample activity logs
INSERT INTO activity_logs (user_id, action, resource_type, details) VALUES
((SELECT id FROM users WHERE email = 'admin@drmmo.gov.ph'), 'user_login', 'authentication', '{"ip": "192.168.1.1"}'),
((SELECT id FROM users WHERE email = 'officer1@drmmo.gov.ph'), 'incident_created', 'incident', '{"incident_id": "sample-id"}'),
((SELECT id FROM users WHERE email = 'responder1@drmmo.gov.ph'), 'status_update', 'responder', '{"status": "on_duty"}');

-- Insert sample damage assessments
INSERT INTO damage_assessments (barangay_id, assessor_id, property_type, damage_level, estimated_cost, affected_people, description) VALUES
((SELECT id FROM barangays WHERE name = 'Barangay Riverside'), (SELECT id FROM users WHERE email = 'officer1@drmmo.gov.ph'), 'residential', 'moderate', 50000.00, 25, 'Flood damage to residential properties'),
((SELECT id FROM barangays WHERE name = 'Barangay Centro'), (SELECT id FROM users WHERE email = 'officer1@drmmo.gov.ph'), 'infrastructure', 'severe', 150000.00, 0, 'Road and bridge damage from recent storm');

-- Insert sample rescue operations
INSERT INTO rescue_operations (lead_responder_id, operation_type, status, casualties, people_rescued, notes) VALUES
((SELECT id FROM responders WHERE team_name = 'Rapid Response Team Alpha'), 'flood_rescue', 'completed', 0, 12, 'Successfully evacuated 12 families from flooded areas'),
((SELECT id FROM responders WHERE team_name = 'Medical Response Team'), 'medical_rescue', 'active', 0, 3, 'Ongoing medical assistance to affected residents');