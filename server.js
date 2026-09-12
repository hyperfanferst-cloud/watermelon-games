const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Change this in production. Prefer setting ACCESS_CODE as an environment variable.
const ACCESS_CODE = process.env.ACCESS_CODE || "CHANGE-ME-1234";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false // Set true when running behind HTTPS.
  }
}));

// Public site
app.use(express.static(path.join(__dirname, "public")));

// Protected games area. The browser cannot access this folder without a session.
app.get("/games", (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect("/?error=login");
  }
  res.sendFile(path.join(__dirname, "private", "games.html"));
});

app.get("/play/game1", (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect("/?error=login");
  }

  res.sendFile(path.join(__dirname, "private", "game1.html"));
});

app.post("/login", (req, res) => {
  const code = String(req.body.code || "");

  if (code === ACCESS_CODE) {
    req.session.authenticated = true;
    return res.redirect("/games");
  }

  return res.redirect("/?error=invalid");
});

app.get("/play/granny", (req, res) => {
  if (!req.session.authenticated) {
    return res.redirect("/?error=login");
  }

  res.sendFile(path.join(__dirname, "public", "storage", "granny.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});