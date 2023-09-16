const inquirer = require('inquirer');
const mysql = require('mysql2');
const table = require('./Helper/table')

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'gukwuw',
  database: 'employee_db'
});

// Make sure database is connected
function connectToDatabase() {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to the employee_db database.');
        resolve();
      }
    });
  });
}

// List of choices from main question
const mainChoices = [
  'View All Employees',
  'Add Employee',
  'Update Employee Role',
  'View All Roles',
  'Add Role',
  'View All Departments',
  'Add Department',
  'Quit'
];


// Main question everything should loop back to
const mainQuestion = {
  type: 'list',
  message: 'What would you like to do?',
  name: 'main',
  choices: mainChoices
};

// 'View All Employees' option
async function displayEmployeeTable() {
  db.query(`SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee e INNER JOIN role r ON e.role_id = r.id INNER JOIN department d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id;`, function (err, results) {
    if (err) {
      console.error('Error fetching data from the database:', err);
    } else {      
      table(results); // Display the data in a table format
      
    }

    // Continue to the next iteration of the loop
    askMainQuestion();
  });
}



// This one needs to be more complicated
async function updateRole() {
  await inquirer.prompt([
    {
      name: 'employee',
      type: 'list',
      message: 'Which employee would you like to update?',
      choices: await getEmployeeNames(),
    },
    {
      name: 'updatedRole',
      message: 'What is the employees new role?',
      type: 'list',
      choices: await getRoles()
    }
  ])
  .then((response) => {
    try {
      const employeeName = response.employee;
      const employeeFirstName = employeeName.split(' ')[0];
      const employeeLastName = employeeName.split(' ')[1];
    
    const roleQuery = `
      UPDATE employee e
      JOIN role r ON e.role_id = r.id
      SET e.role_id = (
        SELECT id
        FROM role
        WHERE title = ?
      )
      WHERE  e.first_name = ? and e.last_name = ?;`;

    db.query(roleQuery, [response.updatedRole, employeeFirstName, employeeLastName]);
    
    askMainQuestion();
    } catch (error) {
      console.error('Error:', error);
    }

  });
  
}

async function displayRoles() {
  db.query(`SELECT r.id, r.title, d.name, r.salary FROM role r inner join department d ON r.department_id = d.id;`, function (err, results) {
    if (err) {
      console.error('Error fetching data from the database:', err);
    } else {      
      table(results); // Display the data in a table format      
    }
    // Continue to the next iteration of the loop
    askMainQuestion();
  });
}

async function viewDepartments() {
  db.query('SELECT * FROM department', function (err, results) {
    if (err) {
      console.error('Error fetching data from the database:', err);
    } else {      
      table(results); // Display the data in a table format      
    }
    // Continue to the next iteration of the loop
    askMainQuestion();
  });
}

// Function to retrieve department names from the database
async function getDepartmentNames() {
  return new Promise((resolve, reject) => {
    db.query('SELECT name FROM department', (err, results) => {
      if (err) {
        reject(err);
      } else {
        const departmentNames = results.map((row) => row.name);
        resolve(departmentNames);
      }
    });
  });
}

// Function to retrieve employee first and last names from the database
async function getEmployeeNames() {
  return new Promise((resolve, reject) => {
    db.query('SELECT first_name, last_name FROM employee', (err, results) => {
      if (err) {
        console.error('Error executing database query:', err);
        reject(err);
      } else {
        if (results && results.length > 0) {
          const employeeNames = results.map((row) => 
            row.first_name + ' ' + row.last_name
          );
          //console.log('Retrieved employee names:', employeeNames);
          resolve(employeeNames);
        } else {
          console.log('No employee names found.');
          resolve([]); // Resolve with an empty array if there are no results
        }
      }
    });
  });
}

async function getRoles() {
  return new Promise((resolve, reject) => {
    db.query('SELECT title FROM role', (err, results) => {
      if (err) {
        reject(err);
      } else {
        const roles = results.map((row) => row.title);
        resolve(roles);
      }
    });
  });
}



async function getManager() {
  return new Promise((resolve, reject) => {
    db.query(`select distinct concat (m.first_name, ' ', m.last_name) AS manager_name FROM employee e INNER JOIN employee m on e.manager_id;`, (err, results) => {
      if (err) {
        reject(err);
      } else {
        const manager = results.map((row) => row.manager_name);
        manager.unshift('None');
        resolve(manager);      
      }
    });
  });
}


async function addEmployee() {
  await inquirer.prompt(// Questions for adding employee information
  [
    {
      message:'What is the Employees first name?',
      type: 'input',
      name: 'name'
    },
    {
      message:'What is the Employees last name?',
      type: 'input',
      name: 'lastName'
    },
    {
      message:'What is the Employees role?',
      type: 'list',
      name: 'role',
      choices: await getRoles(),
    },
    {
      // Need a getEmployeeManager function
      message:'Add the Employees manager:',
      type:'list', // Needs to be a list
      name:'manager',
      choices: await getManager(),
    }
  ]
  )
  
  .then(async (response) => {
    console.log(response);
  
    try {
      let managerFirstName = null;
      let managerLastName = null;
  
      if (response.manager !== 'None') {
        const managerName = response.manager;
        managerFirstName = managerName.split(' ')[0];
        managerLastName = managerName.split(' ')[1];
      }
  
      const insertQuery = `
        INSERT INTO employee (first_name, last_name, role_id, manager_id)
        SELECT
          '${response.name}' AS first_name,
          '${response.lastName}' AS last_name,
          r.id AS role_id,
          (CASE
            WHEN ? IS NULL THEN NULL
            ELSE m.id
          END) AS manager_id
        FROM
          role r
        LEFT JOIN employee m ON m.first_name = ? AND m.last_name = ?
        WHERE
          r.title = ?;
      `;
  
      // Execute the SQL query with parameterized values
      db.query(insertQuery, [managerFirstName, managerFirstName, managerLastName, response.role]);
  
      // Continue with your code after the insertion
      askMainQuestion();
    } catch (error) {
      console.error('Error:', error);
      // Handle the error appropriately
    }
  });
  

}

// function for prompting questions and branching out with responses
async function askMainQuestion() {
  const response = await inquirer.prompt(mainQuestion);

  switch (response.main) {
    case 'View All Employees':
      await displayEmployeeTable();
      break;
    case 'Add Employee':
      await addEmployee();
      break;
    case 'Update Employee Role':
      await updateRole();
      break;
    case 'View All Roles':
      await displayRoles();
      break;
    case 'Add Role':
      await inquirer.prompt([
        {
          name: 'addRole',
          message: 'What is the new role?',
          type: 'input',
        },
        {
          name:'salary',
          message:'What is the salary?',
          type:'input',
          
        },
        {
          name:'department',
          message:'Which Department does this Role belong to?',
          type:'list',
          
          choices: await getDepartmentNames(),
        }      
      ])
      .then(async (response) => {
        
        try{
          const role = `
            INSERT INTO role (title, salary, department_id)
            SELECT
            '${response.addRole}' AS title,
            ${response.salary} AS salary,
            (SELECT id FROM department WHERE name = '${response.department}') AS department_id;`;
          
          db.query(role);
          
          askMainQuestion();
        } catch {
          console.error('Error:', error);
        }
      });
      break;
    case 'View All Departments':
      await viewDepartments();
      break;
    case 'Add Department':
      await inquirer.prompt({
        name: 'addDepartment',
        message: 'What is the new Department?',
        type: 'input'
      })
      .then((response) => {
        console.log(response);
      })
      askMainQuestion();
      break;
    case 'Quit':
      console.log('Goodbye!');
      db.end(); // Close the database connection
      break;
    default:
      console.log('Invalid choice');
      askMainQuestion();
  }
}

async function init() {
  try {
    await connectToDatabase();
    await askMainQuestion();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

// Start the application
init();
