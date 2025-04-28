import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';
import { createClient } from 'redis';

const app = express();
const port = 4000;

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost',          // Your MySQL service name from docker-compose
  user: 'fazt',        // MySQL username
  password: 'mypassword', // MySQL password
  database: 'users',   // Database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Redis Client Setup
const redisClient = createClient({
  url: 'redis://localhost:6379', // Redis service name from docker-compose
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect Redis client
await redisClient.connect();

// Route: Form to add a new user
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

// Route: Handle form submission and store user
app.post('/store-user', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    const connection = await pool.getConnection();
    try {
      const [results] = await connection.execute(
        'INSERT INTO users (fullname, email) VALUES (?, ?)',
        [name, email]
      );

      // Invalidate cache after inserting
      await redisClient.del('users:list');

      res.status(201).send(`
        <h1>User Added Successfully!</h1>
        <p>Name: ${name}</p>
        <p>Email: ${email}</p>
        <p>User ID: ${results.insertId}</p>
        <p><a href="/">Go to Home</a></p>
      `);
    } finally {
      connection.release();
    }
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

// Route: List all users with Redis cache (1 hour)
app.get('/users', async (req, res) => {
  try {
    let source = '';

    // Check Redis first
    const cachedUsers = await redisClient.get('users:list');

    if (cachedUsers) {
      console.log('Serving from Redis Cache!');
      const users = JSON.parse(cachedUsers);
      source = 'Redis Cache';
      return sendUsersHtml(res, users, source);
    }

    // If not cached, fetch from MySQL
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM users');

      // Store result in Redis for 1 hour
      await redisClient.setEx('users:list', 3600, JSON.stringify(rows));

      console.log('Serving from MySQL and storing in Redis.');
      source = 'MySQL Database';
      return sendUsersHtml(res, rows, source);
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send('<h1>Error fetching users</h1>');
  }
});

// Helper function: Render users in HTML
function sendUsersHtml(res, users, source) {
  let html = `
    <h1>All Users</h1>
    <p><strong>Data loaded from: ${source}</strong></p>
    <table border="1" cellpadding="10">
      <thead>
        <tr>
          <th>ID</th>
          <th>Full Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
  `;
  users.forEach(user => {
    html += `
      <tr>
        <td>${user.id}</td>
        <td>${user.fullname}</td>
        <td>${user.email}</td>
      </tr>
    `;
  });
  html += `
      </tbody>
    </table>
    <p><a href="/">Back to Home</a></p>
  `;
  res.send(html);
}

// Home route
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to User Database Management</h1>
    <p><a href="/add-data-form">Add New User</a></p>
    <p><a href="/users">List All Users</a></p>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
