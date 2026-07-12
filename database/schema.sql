SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    head_user_id INT,
    parent_department_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'asset_manager', 'dept_head', 'employee') DEFAULT 'employee',
    department_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    reset_token_hash VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

ALTER TABLE Departments ADD CONSTRAINT fk_department_head FOREIGN KEY (head_user_id) REFERENCES Users(id) ON DELETE SET NULL;

CREATE TABLE AssetCategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    serial_number VARCHAR(100),
    acquisition_date DATE,
    acquisition_cost DECIMAL(10,2),
    `condition` VARCHAR(100),
    location VARCHAR(255),
    is_bookable BOOLEAN DEFAULT FALSE,
    status ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed') DEFAULT 'Available',
    prior_status ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'),
    department_id INT,
    photo_url VARCHAR(255),
    qr_code TEXT,
    documents JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES AssetCategories(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

CREATE INDEX idx_asset_tag ON Assets(asset_tag);
CREATE INDEX idx_serial_number ON Assets(serial_number);

CREATE TABLE Allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    employee_id INT,
    department_id INT,
    allocated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    return_condition_notes TEXT,
    status ENUM('active', 'returned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES Departments(id) ON DELETE RESTRICT
);

CREATE INDEX idx_allocation_asset_status ON Allocations(asset_id, status);

CREATE TABLE TransferRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason TEXT,
    status ENUM('Requested', 'Approved', 'Rejected', 'Reallocated') DEFAULT 'Requested',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE RESTRICT,
    FOREIGN KEY (from_user_id) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_user_id) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES Users(id) ON DELETE RESTRICT
);

CREATE TABLE Bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_asset_id INT NOT NULL,
    booked_by INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Upcoming',
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_asset_id) REFERENCES Assets(id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_by) REFERENCES Users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_booking_resource_times ON Bookings(resource_asset_id, start_time, end_time);

CREATE TABLE MaintenanceRequests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    raised_by INT NOT NULL,
    issue_description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    photo_url VARCHAR(255),
    status ENUM('Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved') DEFAULT 'Pending',
    approved_by INT,
    technician_name VARCHAR(255),
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE RESTRICT,
    FOREIGN KEY (raised_by) REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES Users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_maintenance_status ON MaintenanceRequests(status);

CREATE TABLE AuditCycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scope_department_id INT,
    scope_location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Open', 'Closed') DEFAULT 'Open',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scope_department_id) REFERENCES Departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT
);

CREATE TABLE AuditAuditors (
    audit_cycle_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (audit_cycle_id, user_id),
    FOREIGN KEY (audit_cycle_id) REFERENCES AuditCycles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE AuditItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    audit_cycle_id INT NOT NULL,
    asset_id INT NOT NULL,
    auditor_id INT,
    verification_status ENUM('Pending', 'Verified', 'Missing', 'Damaged') DEFAULT 'Pending',
    notes TEXT,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_cycle_id) REFERENCES AuditCycles(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES Assets(id) ON DELETE RESTRICT,
    FOREIGN KEY (auditor_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('Asset Assigned', 'Maintenance Approved', 'Maintenance Rejected', 'Booking Confirmed', 'Booking Cancelled', 'Booking Reminder', 'Transfer Approved', 'Overdue Return', 'Audit Discrepancy') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(100),
    related_entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE ActivityLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
