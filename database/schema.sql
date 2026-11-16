-- DRRMO Database Schema for Lovable Cloud Postgres

-- Users table with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'drrmo_officer', 'responder', 'barangay_official', 'citizen')),
    phone VARCHAR(20),
    barangay_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barangays table
CREATE TABLE barangays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    municipality VARCHAR(255) NOT NULL,
    province VARCHAR(255) NOT NULL,
    population INTEGER,
    coordinates POINT, -- PostGIS point for location
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL, -- fire, flood, earthquake, etc.
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'responding', 'resolved', 'closed')),
    location POINT, -- PostGIS point
    address TEXT,
    barangay_id UUID REFERENCES barangays(id),
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    images TEXT[], -- Array of image URLs from Lovable Storage
    videos TEXT[], -- Array of video URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Responders table
CREATE TABLE responders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    team_name VARCHAR(255),
    specialization VARCHAR(100), -- fire, medical, rescue, etc.
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'on_duty', 'off_duty')),
    current_location POINT, -- Real-time GPS location
    vehicle_type VARCHAR(100),
    vehicle_plate VARCHAR(50),
    equipment TEXT[], -- Array of equipment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evacuation centers table
CREATE TABLE evacuation_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    barangay_id UUID REFERENCES barangays(id),
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'active', 'full', 'closed')),
    facilities TEXT[], -- Array of facilities available
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- vehicle, equipment, supplies, personnel
    category VARCHAR(100), -- medical, food, shelter, etc.
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50), -- pieces, kg, liters, etc.
    location_id UUID, -- Could reference barangay or evacuation center
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'in_use', 'maintenance')),
    assigned_to UUID REFERENCES responders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- alert, warning, info, emergency
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    target_audience VARCHAR(50) NOT NULL, -- all, barangay, role, specific_users
    barangay_id UUID REFERENCES barangays(id),
    sent_by UUID REFERENCES users(id),
    is_broadcast BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency requests table (from citizens)
CREATE TABLE emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    description TEXT,
    location POINT,
    address TEXT,
    barangay_id UUID REFERENCES barangays(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'responding', 'resolved', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    images TEXT[],
    assigned_to UUID REFERENCES responders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- incident_report, damage_assessment, analytics, etc.
    content JSONB, -- Flexible content storage
    generated_by UUID REFERENCES users(id),
    incident_id UUID REFERENCES incidents(id),
    barangay_id UUID REFERENCES barangays(id),
    date_range TSRANGE, -- Date range for the report
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100), -- incident, responder, etc.
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Damage assessments table
CREATE TABLE damage_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    barangay_id UUID REFERENCES barangays(id),
    assessor_id UUID REFERENCES users(id),
    property_type VARCHAR(100), -- residential, commercial, infrastructure
    damage_level VARCHAR(20) CHECK (damage_level IN ('minor', 'moderate', 'severe', 'total')),
    estimated_cost DECIMAL(15,2),
    affected_people INTEGER,
    description TEXT,
    images TEXT[],
    coordinates POINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rescue operations table
CREATE TABLE rescue_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES incidents(id),
    lead_responder_id UUID REFERENCES responders(id),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    operation_type VARCHAR(100), -- search, rescue, medical, evacuation
    location POINT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    resources_used UUID[], -- Array of resource IDs
    personnel_involved UUID[], -- Array of responder IDs
    casualties INTEGER DEFAULT 0,
    people_rescued INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_barangay ON incidents(barangay_id);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_responders_status ON responders(status);
CREATE INDEX idx_responders_location ON responders USING GIST(current_location);
CREATE INDEX idx_evacuation_centers_status ON evacuation_centers(status);
CREATE INDEX idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_responders_updated_at BEFORE UPDATE ON responders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evacuation_centers_updated_at BEFORE UPDATE ON evacuation_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_requests_updated_at BEFORE UPDATE ON emergency_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_damage_assessments_updated_at BEFORE UPDATE ON damage_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rescue_operations_updated_at BEFORE UPDATE ON rescue_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();