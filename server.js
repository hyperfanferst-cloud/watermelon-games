const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.ACCESS_CODE || "CHANGE-ME-1234";

// Optional database.
// Render uses DATABASE_URL.
// The website can still run locally without it.
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
  });
}

// ===============================
// DATABASE SETUP
// ===============================

async function setupDatabase() {
  if (!pool) {
    console.log(
      "DATABASE_URL not set - suggestions disabled locally"
    );
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suggestions (
        id SERIAL PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'Player',
        suggestion_type TEXT NOT NULL DEFAULT 'Other',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Suggestions database ready");
  } catch (error) {
    console.error(
      "Database setup error:",
      error
    );
  }
}

setupDatabase();

// ===============================
// EXPRESS
// ===============================

app.use(
  express.urlencoded({
    extended: false
  })
);

app.use(express.json());

// ===============================
// SESSION
// ===============================

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "change-this-session-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  })
);

// ===============================
// PUBLIC FILES
// ===============================

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);

// ===============================
// LOGIN CHECK
// ===============================

function requireLogin(
  req,
  res,
  next
) {
  if (
    !req.session.authenticated
  ) {
    return res.status(401).json({
      error: "Not logged in"
    });
  }

  next();
}

// ===============================
// LOGIN
// ===============================

app.post(
  "/login",
  (req, res) => {
    const code =
      String(
        req.body.code || ""
      );

    if (
      code === ACCESS_CODE
    ) {
      req.session.authenticated =
        true;

      return res.redirect(
        "/games"
      );
    }

    return res.redirect(
      "/?error=invalid"
    );
  }
);

// ===============================
// LOGOUT
// ===============================

app.post(
  "/logout",
  (req, res) => {
    req.session.destroy(
      () => {
        res.redirect("/");
      }
    );
  }
);

// ===============================
// GAMES PAGE
// ===============================

app.get(
  "/games",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "private",
        "games.html"
      )
    );
  }
);

// ===============================
// GAME 1
// ===============================

app.get(
  "/play/game1",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "private",
        "game1.html"
      )
    );
  }
);

// ===============================
// GRANNY
// ===============================

app.get(
  "/play/granny",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "storage",
        "granny.html"
      )
    );
  }
);

// ===============================
// SLOW ROADS
// ===============================

app.get(
  "/play/slowroads",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "storage",
        "slow_roads.html"
      )
    );
  }
);

// ===============================
// COOKIE CLICKER
// ===============================

app.get(
  "/play/cookieclicker",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "storage",
        "cookie_clicker.html"
      )
    );
  }
);

// ==============================
// BITLIFE
// ==============================

app.get(
  "/play/bitlife",
  (req, res) => {
    if (
      !req.session.authenticated
    ) {
      return res.redirect(
        "/?error=login"
      );
    }

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "storage",
        "bitlife.html"
      )
    );
  }
);

// ===============================
// SUGGESTION BOX
// ===============================

app.post(
  "/api/suggestions",
  requireLogin,
  async (req, res) => {
    try {
      if (!pool) {
        return res
          .status(503)
          .json({
            error:
              "Suggestion database unavailable"
          });
      }

      let displayName =
        String(
          req.body.displayName ||
          "Player"
        )
          .trim()
          .slice(0, 20);

      let type =
        String(
          req.body.type ||
          "Other"
        )
          .trim()
          .slice(0, 30);

      let message =
        String(
          req.body.message ||
          ""
        )
          .trim()
          .slice(0, 500);

      if (!displayName) {
        displayName =
          "Player";
      }

      if (!type) {
        type =
          "Other";
      }

      if (
        message.length < 3
      ) {
        return res
          .status(400)
          .json({
            error:
              "Suggestion is too short"
          });
      }

      await pool.query(
        `
        INSERT INTO suggestions (
          display_name,
          suggestion_type,
          message
        )

        VALUES (
          $1,
          $2,
          $3
        )
        `,
        [
          displayName,
          type,
          message
        ]
      );

      return res.json({
        success: true
      });
    } catch (error) {
      console.error(
        "Suggestion error:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Could not save suggestion"
        });
    }
  }
);

// ===============================
// START SERVER
// ===============================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);