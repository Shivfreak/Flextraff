-- ============================================================
-- FLEXTRAFF FINAL DB (1 USER ↔ 1 JUNCTION)
-- ============================================================

-- CLEANUP
DROP TABLE IF EXISTS junction_assignments CASCADE;
DROP TABLE IF EXISTS traffic_cycles CASCADE;
DROP TABLE IF EXISTS rfid_scanner_logs CASCADE;
DROP TABLE IF EXISTS vehicle_detections CASCADE;
DROP TABLE IF EXISTS rfid_scanners CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS traffic_junctions CASCADE;
DROP TABLE IF EXISTS people CASCADE;

-- =========================
-- 1. PEOPLE
-- =========================
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES people(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 2. TRAFFIC JUNCTIONS
-- =========================
CREATE TABLE traffic_junctions (
    id SERIAL PRIMARY KEY,
    junction_name TEXT NOT NULL,
    location TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    status TEXT DEFAULT 'active',
    algorithm_config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 3. ONE-TO-ONE ASSIGNMENT
-- =========================
CREATE TABLE junction_assignments (
    id SERIAL PRIMARY KEY,
    person_id INTEGER UNIQUE REFERENCES people(id) ON DELETE CASCADE,
    junction_id INTEGER UNIQUE REFERENCES traffic_junctions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by INTEGER REFERENCES people(id),
    notes TEXT
);

-- =========================
-- 4. RFID SCANNERS
-- =========================
CREATE TABLE rfid_scanners (
    id SERIAL PRIMARY KEY,
    junction_id INTEGER REFERENCES traffic_junctions(id) ON DELETE CASCADE,
    lane_number INTEGER,
    scanner_mac_address TEXT,
    scanner_position TEXT,
    status TEXT,
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 5. VEHICLE DETECTIONS
-- =========================
CREATE TABLE vehicle_detections (
    id SERIAL PRIMARY KEY,
    junction_id INTEGER REFERENCES traffic_junctions(id),
    scanner_id INTEGER REFERENCES rfid_scanners(id),
    lane_number INTEGER,
    fastag_id TEXT,
    detection_timestamp TIMESTAMP DEFAULT NOW(),
    vehicle_type TEXT,
    processing_status TEXT
);

-- =========================
-- 6. RFID LOGS
-- =========================
CREATE TABLE rfid_scanner_logs (
    id SERIAL PRIMARY KEY,
    junction_id INTEGER REFERENCES traffic_junctions(id),
    cycle_id INTEGER,
    lane_count JSONB,
    log_timestamp TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 7. TRAFFIC CYCLES
-- =========================
CREATE TABLE traffic_cycles (
    id SERIAL PRIMARY KEY,
    junction_id INTEGER REFERENCES traffic_junctions(id),
    cycle_start_time TIMESTAMP DEFAULT NOW(),
    total_cycle_time INTEGER,
    lane_1_green_time INTEGER,
    lane_2_green_time INTEGER,
    lane_3_green_time INTEGER,
    lane_4_green_time INTEGER,
    lane_1_vehicle_count INTEGER,
    lane_2_vehicle_count INTEGER,
    lane_3_vehicle_count INTEGER,
    lane_4_vehicle_count INTEGER,
    total_vehicles_detected INTEGER,
    algorithm_version TEXT,
    calculation_time_ms INTEGER,
    status TEXT
);

-- =========================
-- 8. SYSTEM LOGS
-- =========================
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    junction_id INTEGER REFERENCES traffic_junctions(id),
    log_level TEXT,
    component TEXT,
    message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DUMMY DATA (MIN 3 ROWS EACH)
-- ============================================================

-- PEOPLE (1 ADMIN + 3 USERS)
INSERT INTO people (user_id, username, email, password, role)
VALUES 
('USR-001','admin','admin@flextraff.com','admin123','admin'),
('USR-002','shivam','shivam@gmail.com','1234','user'),
('USR-003','rahul','rahul@gmail.com','1234','user'),
('USR-004','aman','aman@gmail.com','1234','user');

-- JUNCTIONS (3)
INSERT INTO traffic_junctions (junction_name, location, latitude, longitude)
VALUES
('Junction A','Delhi',28.61,77.20),
('Junction B','Noida',28.57,77.32),
('Junction C','Lucknow',26.85,80.95);

-- ASSIGNMENTS (1-1 MAPPING)
INSERT INTO junction_assignments (person_id, junction_id, assigned_by)
VALUES
(2,1,1),
(3,2,1),
(4,3,1);

-- RFID SCANNERS (3)
INSERT INTO rfid_scanners (junction_id,lane_number,scanner_mac_address,scanner_position,status)
VALUES
(1,1,'MAC001','North','active'),
(2,2,'MAC002','South','active'),
(3,3,'MAC003','East','active');

-- VEHICLE DETECTIONS (3)
INSERT INTO vehicle_detections (junction_id,scanner_id,lane_number,fastag_id,vehicle_type,processing_status)
VALUES
(1,1,1,'FT001','car','processed'),
(2,2,2,'FT002','truck','processed'),
(3,3,3,'FT003','bike','pending');

-- RFID LOGS (3)
INSERT INTO rfid_scanner_logs (junction_id,cycle_id,lane_count)
VALUES
(1,1,'{"lane1":10}'),
(2,2,'{"lane2":20}'),
(3,3,'{"lane3":15}');

-- TRAFFIC CYCLES (3)
INSERT INTO traffic_cycles (
junction_id,total_cycle_time,
lane_1_green_time,lane_2_green_time,lane_3_green_time,lane_4_green_time,
lane_1_vehicle_count,lane_2_vehicle_count,lane_3_vehicle_count,lane_4_vehicle_count,
total_vehicles_detected,algorithm_version,calculation_time_ms,status)
VALUES
(1,120,30,30,30,30,10,20,15,5,50,'v1',20,'done'),
(2,100,25,25,25,25,5,10,20,10,45,'v1',22,'done'),
(3,140,35,35,35,35,15,25,20,10,70,'v2',30,'done');

-- SYSTEM LOGS (3)
INSERT INTO system_logs (junction_id,log_level,component,message)
VALUES
(1,'INFO','sensor','working'),
(2,'WARN','api','delay'),
(3,'ERROR','db','connection issue');

-- ============================================================
-- VIEW FOR LOGIN + DASHBOARD
-- ============================================================

CREATE OR REPLACE VIEW user_dashboard_view AS
SELECT 
    p.id,
    p.username,
    p.email,
    p.role,
    j.junction_name,
    j.location,
    tc.total_vehicles_detected,
    tc.total_cycle_time
FROM people p
JOIN junction_assignments ja ON p.id = ja.person_id
JOIN traffic_junctions j ON ja.junction_id = j.id
LEFT JOIN traffic_cycles tc ON j.id = tc.junction_id;