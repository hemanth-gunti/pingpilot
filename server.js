require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const pool = require('./config/db');
const monitorRoutes = require('./routes/monitors');
const authRoutes = require('./routes/auth');
const { startScheduler } = require('./jobs/monitorScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/api/monitors/dashboard');
  }
  res.render('landing');
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`Database connected! Server time: ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send('Database connection failed: ' + err.message);
  }
});

app.use('/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);

startScheduler();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});  