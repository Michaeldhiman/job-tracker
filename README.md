<div align="center">
  <h1>Snap Job</h1>
  <p><strong>A full-stack job application tracking system with resume performance analytics and calendar syncing.</strong></p>
</div>

---

## 📖 Introduction

### The Problem
Job seekers often struggle to track applications across dozens of platforms, losing context on which resume version led to an interview, and managing complex follow-up schedules. Spreadsheets become messy, and ATS systems are designed for recruiters, not applicants.

### The Solution
Snap Job is a centralized, data-driven hub that brings order to the job search. It combines a drag-and-drop Kanban board, Google Calendar interview syncing, resume performance tracking, and automated reminders into a single platform.

### Why I Built This
I built Snap Job to solve my own organizational bottlenecks during the job search process. I needed a tool that could track my interview schedule natively with Google Calendar and definitively prove which resume templates were yielding the highest interview conversion rates. Developing this project allowed me to solve a real problem while gaining hands-on experience with OAuth 2.0 flows, MongoDB aggregation pipelines, and background task scheduling.

---

## ✨ Technical Highlights

- **JWT Authentication:** Stateless session management utilizing JSON Web Tokens passed via `Authorization` headers, paired with bcrypt password hashing.
- **Google OAuth 2.0 Integration:** Implemented the Google OAuth flow allowing users to securely authenticate and link their Google Calendars using the `googleapis` SDK.
- **Background Task Scheduling:** Utilized `node-cron` within the Express server to periodically scan the database and dispatch automated interview reminder emails.
- **Interactive Kanban Board:** Built using `@dnd-kit/core` for accessible, performant drag-and-drop application pipeline management.
- **Resume Analytics via Aggregation:** Leveraged complex MongoDB aggregation pipelines to calculate interview conversion rates per resume, visualized on the frontend with `recharts`.
- **API Security:** Fortified Express endpoints with `helmet` for security headers, `express-mongo-sanitize` to prevent NoSQL injection, and strict rate-limiting middleware.
- **Direct Cloudinary Uploads:** Integrated `multer` to buffer resume uploads in memory and stream them directly to Cloudinary for secure CDN storage.

---

## 🏗️ Architecture

Snap Job utilizes a decoupled client-server architecture built on the MERN stack.

### Frontend
- **React (v18) & Vite:** Component-based UI with fast HMR tooling.
- **Tailwind CSS:** Utility-first styling with a responsive, mobile-first approach.
- **State Management:** React Context API for handling global states (Authentication, Theme, Toast Notifications).
- **Forms:** `react-hook-form` coupled with `zod` schema validation for strict client-side data integrity.
- **Data Visualization:** `recharts` for rendering interactive analytics dashboards.

### Backend
- **Node.js & Express.js:** RESTful API architecture handling routing, middleware, and request validation.
- **MongoDB & Mongoose:** NoSQL database schema designed with relational references (e.g., jobs linked to specific resume ObjectIDs).
- **Scheduled Jobs:** A `node-cron` service runs independently of the request-response cycle to execute time-sensitive tasks.

### Integrations
- **Google Calendar API:** Exchanges an offline authorization code for a `refresh_token`, allowing the server to push interview events directly to a user's calendar.
- **Cloudinary:** Secure file storage for user resumes.
- **Resend:** Transactional email delivery API for contact forms and automated interview reminders.

---

## ⚙️ Environment Variables

The application requires specific environment variables to function correctly. Reference the `.env.example` files in their respective directories.

### Backend (`backend/.env`)

**Server & Database**
- `NODE_ENV`: `development` or `production`
- `PORT`: Server port (default: `5000`)
- `BACKEND_URL`: Absolute URL of the backend (e.g., `http://localhost:5000`)
- `FRONTEND_URL`: URL of the frontend for CORS and redirects
- `CORS_ORIGINS`: Comma-separated list of allowed browser origins
- `MONGO_URI`: MongoDB connection string

**Security & API Limits**
- `JWT_SECRET`: Cryptographic key for signing JSON Web Tokens
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting
- `RATE_LIMIT_MAX`: Maximum requests allowed within the window

**Google APIs**
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret
- `GOOGLE_REDIRECT_URI`: Callback URI for Google Calendar authorization
- `GOOGLE_LOGIN_REDIRECT_URI`: Callback URI for Google Login authentication

**Third-Party Services**
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary credentials
- `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_EMAIL`: Resend email delivery configuration

**Background Scheduler**
- `SCHEDULER_CRON_EXPRESSION`: Cron interval (e.g., `*/15 * * * *`)
- `SCHEDULER_TIMEZONE`: Timezone for execution

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL`: Full URL to the backend API

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB (Local instance or Atlas cluster)
- Google Cloud Console Account (For OAuth & Calendar APIs)
- Cloudinary Account (For file storage)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/job-tracker.git
cd job-tracker
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
*Populate the `.env` file with your database URI, JWT secret, and necessary API keys.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```
*Ensure `VITE_API_BASE_URL` points to your running backend server.*

### 4. Running Locally
Run the frontend and backend development servers simultaneously in separate terminals:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` to access the application.

---

## 📁 Project Structure

```text
job-tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Centralized constants & runtime env parsing
│   │   ├── controllers/     # Route request handlers
│   │   ├── fileUpload/      # Cloudinary and Multer configuration
│   │   ├── middleware/      # Auth validation, error handling, rate limits
│   │   ├── models/          # Mongoose schemas (User, Job, Resume, Event, etc.)
│   │   ├── routes/          # Express API route endpoints
│   │   ├── services/        # Logic layer (Google API, Resend, Schedulers)
│   │   ├── utils/           # Helper functions (CSV generators)
│   │   ├── app.js           # Core Express application setup
│   │   ├── server.js        # HTTP server entry point & DB connection
│   │   └── seed.js          # Database seeding script
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/             # Axios API client services
    │   ├── components/      # Reusable React components (UI, layouts, forms)
    │   ├── context/         # React Context Providers (Auth, Theme, Toast)
    │   ├── hooks/           # Custom React hooks
    │   ├── pages/           # High-level route components
    │   ├── utils/           # Frontend constants & formatting helpers
    │   ├── App.jsx          # Root application wrapper
    │   ├── index.css        # Global CSS & Tailwind directives
    │   ├── main.jsx         # React DOM renderer
    │   └── routes.jsx       # React Router definition
    └── package.json
```

---

## 🧠 Key Learnings

Building Snap Job provided extensive practical experience in several key areas:
- **Navigating OAuth 2.0:** Implementing both standard Google Login and the more complex offline access flow required to obtain and refresh tokens for the Google Calendar API.
- **MongoDB Aggregations:** Moving complex data processing (like calculating interview conversion rates and monthly application trends) from the Node.js server into the database layer using advanced aggregation pipelines.
- **Background Task Resilience:** Learning to safely run `node-cron` schedulers within an Express process, including error handling and ensuring reminders are dispatched exactly once.
- **Drag-and-Drop UX:** Understanding the complexities of managing shared state and calculating positional logic when utilizing `@dnd-kit` for Kanban interfaces.

---

## 🔮 Future Improvements

- **Database Encryption at Rest:** Implement AES encryption for sensitive fields, specifically the Google OAuth `refreshToken` currently stored in plain text.
- **Advanced Pagination & Caching:** Implement cursor-based pagination for the Jobs list and introduce Redis caching for aggregation-heavy analytics endpoints.
- **Dedicated Worker Process:** Decouple the `node-cron` scheduler from the Express API server into a standalone background worker (e.g., using BullMQ and Redis) to allow for horizontal scaling of the web server.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
