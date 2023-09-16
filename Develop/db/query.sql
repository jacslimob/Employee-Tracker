INSERT INTO role (title, salary, department_id)
SELECT
  'Water Treatment Plant Operator' AS title,
   75000 AS salary,
  (SELECT id FROM department WHERE name = 'Sales') AS department_id;
