// routes/authRoutes.js
const express = require('express');
const { login } = require('../controller/AuthController');

const loginrouter = express.Router();

loginrouter.post('/login', login);

module.exports = loginrouter;
