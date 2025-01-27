import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import axios from 'axios';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, FormsModule],
})
export class AppComponent {
  title = 'Todo App';

  // Variables for todos and authentication
  todos: { _id: string; text: string; done: boolean }[] = [];
  newTodoText = '';
  authToken: string | null = localStorage.getItem('authToken');

  // Registration form state
  registerUsername = '';
  registerPassword = '';
  registerError = '';
  registerSuccess = '';

  // Login form state
  loginUsername = '';
  loginPassword = '';
  loginError = '';

  constructor() {
    if (this.authToken) {
      this.getTodos();
    }
  }

  // Register a new user
  register() {
    if (!this.registerUsername || !this.registerPassword) {
      this.registerError = 'Both username and password are required.';
      this.registerSuccess = '';
      return;
    }

    axios
      .post('http://localhost:5001/api/register', {
        username: this.registerUsername,
        password: this.registerPassword,
      })
      .then(() => {
        this.registerSuccess = 'Registration successful! Please log in.';
        this.registerError = '';
        this.registerUsername = '';
        this.registerPassword = '';
      })
      .catch((error) => {
        this.registerError =
          error.response?.data?.message || 'Registration failed.';
        this.registerSuccess = '';
        console.error('Registration failed:', error);
      });
  }

  // Log in a user
  login() {
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError = 'Both username and password are required.';
      return;
    }

    axios
      .post('http://localhost:5001/api/login', {
        username: this.loginUsername,
        password: this.loginPassword,
      })
      .then((response) => {
        this.authToken = response.data.token;
        localStorage.setItem('authToken', this.authToken || '');
        this.getTodos(); // Fetch todos after login
        this.loginError = '';
      })
      .catch((error) => {
        this.loginError =
          error.response?.data?.message || 'Login failed. Please try again.';
        console.error('Login error:', error);
      });
  }

  // Log out a user
  logout() {
    localStorage.removeItem('authToken');
    this.authToken = null;
    this.todos = [];
  }

  // Fetch todos from the server
  getTodos() {
    axios
      .get('http://localhost:5001/api/todos', {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })
      .then((response) => {
        this.todos = response.data;
      })
      .catch((error) => {
        console.error('Error fetching todos:', error);
      });
  }

  // Add a new todo
  addTodo() {
    if (!this.newTodoText.trim()) {
      return; // Don't add an empty todo
    }

    axios
      .post(
        'http://localhost:5001/api/todos',
        { text: this.newTodoText },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      )
      .then((response) => {
        this.todos.push(response.data); // Add the new todo to the list
        this.newTodoText = ''; // Clear the input field
      })
      .catch((error) => {
        console.error('Error adding todo:', error);
      });
  }

  // Toggle a todo's completion status
  toggleDone(todo: { _id: string; done: boolean }) {
    axios
      .put(
        `http://localhost:5001/api/todos/${todo._id}`,
        { done: !todo.done },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      )
      .then((response) => {
        todo.done = response.data.done; // Update the local todo status
      })
      .catch((error) => {
        console.error('Error updating todo:', error);
      });
  }

  // Delete a todo
  deleteTodo(todo: { _id: string }) {
    axios
      .delete(`http://localhost:5001/api/todos/${todo._id}`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })
      .then(() => {
        this.todos = this.todos.filter((t) => t._id !== todo._id); // Remove from local list
      })
      .catch((error) => {
        console.error('Error deleting todo:', error);
      });
  }
}
