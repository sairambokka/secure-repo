🛡️ Security Vulnerability Fixes for secure-code Repository
This document outlines identified vulnerabilities, detailed Proofs of Concept (PoCs), and their corresponding fixes.

1. SQL Injection
Location: routes/api.js

PoC:

bash
Copy
Edit
GET /api/users/search?term=a' OR '1'='1
Translates to:

sql
Copy
Edit
SELECT user_id, username, email FROM users WHERE username LIKE '%a' OR '1'='1%'
Returns all users.

Dangerous Variant:

bash
Copy
Edit
GET /api/users/search?term='; DROP TABLE users; --
Fix:

javascript
Copy
Edit
// BAD CODE
const queryText = "SELECT user_id, username, email FROM users WHERE username LIKE '%" + searchTerm + "%'";

// FIXED CODE
const queryText = "SELECT user_id, username, email FROM users WHERE username LIKE $1";
const queryParams = [`%${searchTerm}%`];
2. Hardcoded JWT Secret
Location: server.js

PoC: Secret visible:
"thisIsMyReallyInsecureSecret123!"
Attackers can forge admin JWTs.

Fix:

javascript
Copy
Edit
// BAD CODE
const config = {
  jwtSecret: "thisIsMyReallyInsecureSecret123!",
};

// FIXED CODE
const config = {
  jwtSecret: process.env.JWT_SECRET,
};

// Server Startup Check
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("ERROR: JWT_SECRET environment variable is missing or too weak!");
  process.exit(1);
}
Recommendation: Set JWT_SECRET as a strong, random 32+ character string.

3. Weak Password Hashing
Location: routes/api.js

PoC: MD5 hashes easily cracked using rainbow tables.

Fix:

javascript
Copy
Edit
const bcrypt = require('bcrypt');

router.post("/users/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).send("Required fields: username, password, email.");
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 12); // Cost factor 12
    // Save hashedPassword securely in DB
    res.status(201).send(`User ${username} registered.`);
  } catch (err) {
    console.error("Error during user registration:", err);
    res.status(500).send("Registration failed");
  }
});
4. Missing Authentication on Admin Routes
Location: routes/admin.js

PoC: Anyone can access:

/admin/dashboard

/admin/logs

/admin/users/*

Fix: Create middleware/auth.js:

javascript
Copy
Edit
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
Then apply middleware to admin routes:

javascript
Copy
Edit
const express = require("express");
const authMiddleware = require("../middleware/auth");

module.exports = function (config) {
  const router = express.Router();
  router.use(authMiddleware);

  router.get("/dashboard", (req, res) => {
    res.send("Admin Dashboard");
  });

  return router;
};
Testing Instructions:

Request without token → 401 Unauthorized

Obtain token via /auth/login

Access admin route with token → 200 OK

5. Sensitive Information Exposure
Location: server.js

PoC: Leaking:

Database host

API keys

JWT secrets

Fix:

javascript
Copy
Edit
// BAD CODE
console.log("Using JWT Secret:", config.jwtSecret);

// FIXED CODE
if (!process.env.DATABASE_URL) {
  console.warn("WARN: DATABASE_URL not set");
} else {
  console.log("Database connection configured");
}

if (!process.env.API_KEY) {
  console.warn("WARN: API_KEY not set");
} else {
  console.log("API key configured");
}

if (!process.env.JWT_SECRET) {
  console.warn("WARN: JWT_SECRET not set");
} else {
  console.log("JWT secret configured");
}
6. No Input Validation
Location: Various (especially routes/admin.js)

PoC:

No sanitization on user inputs

User ID or product ID abuse

Broken registration with bad payloads

Fix: Install validator:

bash
Copy
Edit
npm install express-validator
Example registration validation:

javascript
Copy
Edit
const { body, param, validationResult } = require('express-validator');

router.post('/users/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .isAlphanumeric().withMessage('Username must contain only letters and numbers'),
  body('email')
    .trim()
    .isEmail().withMessage('Must provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Continue registration...
});
Example param validation:

javascript
Copy
Edit
router.delete('/users/:userId', [
  param('userId')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Continue deletion...
});
✅ Summary

Issue	Status
SQL Injection	Fixed
Hardcoded JWT Secret	Fixed
Weak Password Hashing	Fixed
Missing Admin Authentication	Fixed
Sensitive Information Exposure	Fixed
No Input Validation	Fixed
