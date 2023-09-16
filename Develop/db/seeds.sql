-- Insert sample data into the 'department' table
INSERT INTO department (name)
VALUES
  ('Sales'),
  ('Marketing'),
  ('Finance'),
  ('Engineering');

-- Insert sample data into the 'role' table
INSERT INTO role (title, salary, department_id)
VALUES
  ('Sales Manager', 80000.00, 1),
  ('Sales Representative', 50000.00, 1),
  ('Marketing Manager', 75000.00, 2),
  ('Marketing Specialist', 55000.00, 2),
  ('Financial Analyst', 70000.00, 3),
  ('Accountant', 60000.00, 3),
  ('Software Engineer', 90000.00, 4),
  ('UI/UX Designer', 80000.00, 4);

-- Insert sample data into the 'employee' table
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES
  ('John', 'Doe', 1, NULL),
  ('Jane', 'Smith', 2, 1),
  ('Mike', 'Johnson', 3, NULL),
  ('Emily', 'Davis', 4, 3),
  ('Tom', 'Wilson', 5, NULL),
  ('Sara', 'Brown', 6, 5),
  ('David', 'Lee', 7, NULL),
  ('Linda', 'Hall', 8, 7);
