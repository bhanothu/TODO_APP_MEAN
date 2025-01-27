const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Importing modules
const authMiddleware = require('./authMiddleware');
const User = require('./User');
const Todo = require('./Todo');

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/todo-app', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Routes

// Register a new user
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, 'secret123', { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err });
  }
});

// Create a new todo
app.post('/api/todos', authMiddleware, async (req, res) => {
  const { text } = req.body;

  const todo = new Todo({
    text,
    userId: req.auth.userId // Ensure that userId is coming from the decoded token
  });

  try {
    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Error creating todo', error: err });
  }
});

// Get all todos for the logged-in user
app.get('/api/todos', authMiddleware, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.auth.userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching todos', error: err });
  }
});

// Update a todo's status (mark as done)
app.put('/api/todos/:id', authMiddleware, async (req, res) => {
  const { done } = req.body;
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth.userId },
      { done },
      { new: true }
    );
    if (todo) {
      res.json(todo);
    } else {
      res.status(404).json({ message: 'Todo not found or not authorized' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating todo', error: err });
  }
});

// Delete a todo
app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.auth.userId });
    if (todo) {
      res.json({ message: 'Todo deleted' });
    } else {
      res.status(404).json({ message: 'Todo not found or not authorized' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting todo', error: err });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
