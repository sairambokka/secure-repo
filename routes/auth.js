// In a new file: routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');

module.exports = function(config) {
  const router = express.Router();
  
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // For demo purposes, hardcoded check
    if (username === 'admin' && password === 'securepassword') {
      // Create token with admin claim
      const token = jwt.sign(
        { id: 1, username: 'admin', isAdmin: true },
        process.env.JWT_SECRET || config.jwtSecret,
        { expiresIn: '1h' }
      );
      
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
  
  return router;
};