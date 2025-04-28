require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");

// Import route handlers
const apiRoutes = require("./routes/api");
const adminRoutes = require("./routes/admin");
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

const config = {
  jwtSecret: process.env.JWT_SECRET, // Used for signing tokens maybe?
  appName: "VulnerableApp",
  // Database connection pool setup
  dbPool: new Pool({
    connectionString: process.env.DATABASE_URL, // Loaded from .env
  }),
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api", apiRoutes(config));

app.use("/admin", adminRoutes(config));

app.use('/auth', authRoutes(config));

// --- Default/Catch-all Routes ---
// Simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// Root path handler
app.get("/", (req, res) => {
  // Maybe serve an index.html file or just send a welcome message
  // res.sendFile(path.join(__dirname, 'public', 'index.html'));
  res.send(`Welcome to ${config.appName}!`);
});

// Basic 404 handler for routes not found
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  res.status(500).send("Something broke!");
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`${config.appName} listening at http://localhost:${port}`);

  // // Check if critical env vars are loaded
  // if (!process.env.DATABASE_URL || !process.env.API_KEY) {
  //   console.warn(
  //     "WARN: DATABASE_URL or API_KEY not found in environment variables. Check .env configuration."
  //   );
  // } else {
  //   console.log(
  //     "DB URL Host:",
  //     process.env.DATABASE_URL.split("@")[1].split(":")[0]
  //   );
  //   console.log("API Key Prefix:", process.env.API_KEY.substring(0, 8) + "...");
  // }
  // console.log("Using JWT Secret:", config.jwtSecret);

  if (!process.env.DATABASE_URL) {
    console.warn("WARN: DATABASE_URL not found in environment variables.");
  } else {
    console.log("Database connection configured");
  }
  
  if (!process.env.API_KEY) {
    console.warn("WARN: API_KEY not found in environment variables.");
  } else {
    console.log("API key configured");
  }
  
  if (!process.env.JWT_SECRET) {
    console.warn("WARN: JWT_SECRET not found in environment variables.");
  } else {
    console.log("JWT secret configured");
  }
});
