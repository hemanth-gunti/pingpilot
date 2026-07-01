# PingPilot

**PingPilot** is a Node.js-based website/URL uptime monitoring tool. It periodically checks the availability of the URLs you're tracking, keeps a history of their status, and emails you when something goes down — all through a simple server-rendered dashboard.

> Internally named `uptime-monitor` in `package.json`.

---

## ✨ Features

- 🔐 **Google OAuth login** — sign in with your Google account (via Passport.js)
- 📡 **Scheduled uptime checks** — background cron jobs periodically ping your monitored URLs
- 📧 **Email alerts** — get notified by email when a monitored site goes down (via Nodemailer)
- 🗄️ **Persistent storage** — monitor history and user data stored in PostgreSQL
- 🖥️ **Server-rendered dashboard** — EJS-based views for managing and viewing monitors
- 🔒 **Session-based auth** — authenticated routes protected via middleware

---

## 🛠️ Tech Stack

| Layer            | Technology                          |
|-------------------|--------------------------------------|
| Runtime            | Node.js                             |
| Web framework      | Express 5                           |
| Templating         | EJS                                 |
| Database           | PostgreSQL (`pg`)                   |
| Auth               | Passport.js + Google OAuth 2.0      |
| Sessions           | express-session                     |
| Scheduled jobs     | node-cron                           |
| HTTP requests      | axios                               |
| Email notifications| Nodemailer                          |
| Config             | dotenv                              |
| Dev tooling        | nodemon                             |

---

## 📁 Project Structure

```
pingpilot/
├── config/         # App configuration (DB connection, Passport/Google OAuth strategy, etc.)
├── jobs/           # Scheduled cron jobs (periodic URL/uptime checks)
├── middleware/      # Express middleware (e.g. auth guards)
├── models/          # Database models / queries
├── routes/          # Express route handlers
├── utils/           # Helper utilities (e.g. email sender, ping logic)
├── views/           # EJS templates for the dashboard UI
├── server.js         # App entry point
├── package.json
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A running [PostgreSQL](https://www.postgresql.org/) instance
- A [Google Cloud OAuth 2.0](https://console.cloud.google.com/apis/credentials) Client ID & Secret
- An SMTP-capable email account (for Nodemailer alerts)

### 1. Clone the repository

```bash
git clone https://github.com/hemanth-gunti/pingpilot.git
cd pingpilot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000
SESSION_SECRET=your_session_secret

# Database
DATABASE_URL=postgres://user:password@localhost:5432/pingpilot

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
ALERT_EMAIL_FROM=alerts@example.com
```

> ⚠️ Adjust variable names above to match what's referenced in `config/` and `utils/` — update this section once you confirm the exact keys used in code.

### 4. Set up the database

Make sure your PostgreSQL instance is running and the database referenced in `DATABASE_URL` exists. Run any schema/migration setup your `models/` expect.

### 5. Run the app

```bash
# development (auto-restarts on file changes)
npm run dev

# production
npm start
```

The app will be available at `http://localhost:3000` (or your configured `PORT`).

---

## 🔄 How It Works

1. A logged-in user adds a URL they want to monitor.
2. A **node-cron** job in `jobs/` runs on a schedule, pinging each monitored URL with `axios`.
3. The result (up/down, response time, status code) is recorded via the models layer in PostgreSQL.
4. If a monitored URL is detected as down, **Nodemailer** sends an alert email to the user.
5. The dashboard (EJS views) displays current status and history for all monitored URLs.

---

## 📌 Roadmap Ideas

- [ ] Response-time charts / uptime history graphs
- [ ] Configurable check intervals per monitor
- [ ] Multi-channel alerts (Slack, Discord, SMS)
- [ ] Public status page per user/team
- [ ] API endpoints for programmatic monitor management

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or an issue.

---

## 📄 License

ISC (as declared in `package.json`) — update this section if a different license applies.

---

## 👤 Author

**Hemanth Gunti** — [@hemanth-gunti](https://github.com/hemanth-gunti)