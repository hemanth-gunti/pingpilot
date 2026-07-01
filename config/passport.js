const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

// Save just the user's ID into the session cookie
passport.serializeUser((user, done) => done(null, user.id));

// On each request, look up the full user from the DB using the ID in the session
passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, rows[0] || null);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value || null;
        const name = profile.displayName || null;

        // Check if this Google user already exists in our DB
        const existing = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);

        if (existing.rows.length > 0) {
          return done(null, existing.rows[0]);
        }

        // First time logging in — create a new user row
        const inserted = await pool.query(
          `INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *`,
          [googleId, email, name]
        );
        done(null, inserted.rows[0]);
      } catch (err) {
        done(err);
      }
    }
  )
);

module.exports = passport;