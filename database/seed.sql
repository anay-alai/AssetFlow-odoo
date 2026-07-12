USE assetflow;

-- Departments
INSERT INTO Departments (name) VALUES 
('Engineering'), 
('HR'), 
('Operations');

-- Users (passwords are 'password123' hashed with bcrypt salt rounds 10)
INSERT INTO Users (name, email, password_hash, role, department_id) VALUES 
('Admin User', 'admin@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'admin', NULL),
('Asset Manager 1', 'manager1@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'asset_manager', 3),
('Asset Manager 2', 'manager2@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'asset_manager', 3),
('Dept Head Eng', 'headeng@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'dept_head', 1),
('Dept Head HR', 'headhr@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'dept_head', 2),
('Employee 1', 'emp1@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'employee', 1),
('Employee 2', 'emp2@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'employee', 1),
('Employee 3', 'emp3@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'employee', 2),
('Employee 4', 'emp4@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'employee', 3),
('Employee 5', 'emp5@example.com', '$2b$10$wE0v7V5y0eT2Ua7D4j9YHez7V.6K0C.h8vWb6KqO/Kq8m.kEa8xHq', 'employee', 1);

-- Update Department heads
UPDATE Departments SET head_user_id = 4 WHERE id = 1;
UPDATE Departments SET head_user_id = 5 WHERE id = 2;

-- Asset Categories
INSERT INTO AssetCategories (name, custom_fields) VALUES 
('Laptops', '{"warranty_period": "3 years"}'), 
('Monitors', '{}'), 
('Vehicles', '{"insurance_expiry": "date"}'), 
('Projectors', '{}');

-- Assets
INSERT INTO Assets (asset_tag, name, category_id, serial_number, is_bookable, status, department_id) VALUES 
('AF-0001', 'MacBook Pro 16"', 1, 'C02XD0', 0, 'Allocated', 1),
('AF-0002', 'MacBook Pro 14"', 1, 'C02XD1', 0, 'Available', 1),
('AF-0003', 'Dell XPS 15', 1, 'D02XD0', 0, 'Under Maintenance', 1),
('AF-0004', 'Dell UltraSharp 27', 2, 'M02XD0', 0, 'Allocated', 2),
('AF-0005', 'Company Van', 3, 'V02XD0', 1, 'Available', 3),
('AF-0006', 'Conference Room Projector', 4, 'P02XD0', 1, 'Available', 3),
('AF-0007', 'ThinkPad T14', 1, 'T02XD0', 0, 'Available', 2),
('AF-0008', 'ThinkPad X1', 1, 'T02XD1', 0, 'Available', 3),
('AF-0009', 'iPad Pro', 1, 'I02XD0', 0, 'Lost', 1),
('AF-0010', 'Epson Projector', 4, 'E02XD0', 1, 'Available', 3);

-- Allocations
INSERT INTO Allocations (asset_id, employee_id, department_id, expected_return_date, status) VALUES 
(1, 6, 1, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active'),
(4, 8, 2, DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active');

-- Bookings
INSERT INTO Bookings (resource_asset_id, booked_by, start_time, end_time, status, purpose) VALUES 
(6, 4, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 25 HOUR), 'Upcoming', 'Team Meeting'),
(5, 7, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 50 HOUR), 'Upcoming', 'Client Visit');

-- Maintenance
INSERT INTO MaintenanceRequests (asset_id, raised_by, issue_description, status) VALUES 
(3, 4, 'Screen flickering', 'Approved');

-- Audits
INSERT INTO AuditCycles (name, start_date, end_date, status, created_by) VALUES 
('Q1 General Audit', DATE_SUB(NOW(), INTERVAL 1 MONTH), NOW(), 'Closed', 2),
('Q2 General Audit', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), 'Open', 2);
