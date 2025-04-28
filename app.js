import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';

const app = express();
const port = 4000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL connection setup
const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'fazt', // Your MySQL username
  password: 'mypassword', // Your MySQL password
  database: 'node_app', // MySQL database name
});

// Connect to MySQL
dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + dbConnection.threadId);
});

// Route to display a form for adding data
app.get('/add-data-form', (req, res) => {
  res.send(`
    <h1>Add New User</h1>
    <form action="/store-user" method="POST">
      <div>
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
      </div>
      <br>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
      </div>
      <br>
      <button type="submit">Add User</button>
    </form>
  `);
});

// Route to handle the form submission and store data in MySQL
app.post('/store-user', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Insert user data into MySQL
    const [results] = await dbConnection.promise().query(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );

    res.status(201).send(`
      <h1>User Added Successfully!</h1>
      <p>Name: ${name}</p>
      <p>Email: ${email}</p>
      <p>User ID: ${results.insertId}</p>
      <p><a href="/">Go to Home</a></p>
    `);
  } catch (err) {
    console.error('Error inserting into MySQL:', err);
    res.status(500).send(`
      <h1>Error Adding User</h1>
      <p>Failed to store user data in the database.</p>
      <p>${err.message}</p>
      <p><a href="/add-data-form">Try Again</a></p>
    `);
  }
});

// Route to display a simple welcome page
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Node.js App with MySQL</h1><p><a href="/add-data-form">Add New User</a></p>');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});