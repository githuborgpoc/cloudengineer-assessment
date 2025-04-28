const express = require('express');
const mysql = require('mysql2');
const redis = require('redis');
const bodyParser = require('body-parser');

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

// Redis connection setup
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379, // Default Redis port
});

redisClient.on('error', (err) => {
  console.log('Redis error:', err);
});

// Connect to MySQL
dbConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + dbConnection.threadId);
});

// Route to handle user input and store it in MySQL and Redis
app.post('/add-data', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  // Insert user data into MySQL
  const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
  dbConnection.query(query, [name, email], (err, results) => {
    if (err) {
      console.error('Error inserting into MySQL:', err.stack);
      return res.status(500).json({ message: 'Failed to insert data into MySQL' });
    }

    // Prepare user data to cache in Redis
    const userData = { id: results.insertId, name, email };

    // Store data in Redis
    redisClient.set(`user:${results.insertId}`, JSON.stringify(userData), (err) => {
      if (err) {
        console.error('Error saving data in Redis:', err);
        return res.status(500).json({ message: 'Failed to save data in Redis' });
      }

      // Return a success response
      res.status(201).json({
        message: 'User added successfully!',
        userId: results.insertId,
        userData,
      });
    });
  });
});

// Route to retrieve user data
app.get('/get-user/:id', (req, res) => {
  const userId = req.params.id;

  // Check Redis cache first
  redisClient.get(`user:${userId}`, (err, data) => {
    if (err) {
      console.error('Redis error:', err);
      return res.status(500).json({ message: 'Error fetching data from Redis' });
    }

    if (data) {
      // If data found in Redis, return it
      return res.json({
        message: 'User fetched from Redis!',
        user: JSON.parse(data),
      });
    } else {
      // If data not found in Redis, fetch from MySQL
      const query = 'SELECT * FROM users WHERE id = ?';
      dbConnection.query(query, [userId], (err, results) => {
        if (err) {
          console.error('Error fetching from MySQL:', err.stack);
          return res.status(500).json({ message: 'Failed to fetch data from MySQL' });
        }

        if (results.length > 0) {
          // Store in Redis for future requests
          redisClient.set(
            `user:${userId}`,
            JSON.stringify(results[0]),
            (err) => {
              if (err) {
                console.error('Error saving data in Redis:', err);
              }
            }
          );
          return res.json({
            message: 'User fetched from MySQL and cached to Redis!',
            user: results[0],
          });
        } else {
          return res.status(404).json({ message: 'User not found' });
        }
      });
    }
  });
});

// Route to display a simple welcome page
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Node.js App with MySQL and Redis</h1>');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
