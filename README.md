# 🎬 IMovies — Movie Ticket Booking Made Simple

A seamless online platform that enhances the cinema experience by allowing users to browse movies, select showtimes, and reserve seats with **real-time availability tracking**. Built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and protected with **JWT authentication**.

> ✨ Features: secure user authentication · booking management · interactive seat picker · intuitive responsive interface (Bootstrap)

---

## 🚀 Live Demo

| Resource | Link |
|---|---|
| 🌐 Frontend (live) | _paste your Vercel URL here after deploying_ |
| ⚙️ Backend API (live) | _paste your Vercel/Render URL here after deploying_ |
| 🐙 GitHub repo | https://github.com/mahimavaishnav/imovies |

**Demo accounts (after `npm run seed`):**
| Role | Email | Password |
|---|---|---|
| ⭐ Admin | `admin@imovies.dev` | `admin123` |
| 👤 User | `test@imovies.dev` | `test123` |

**Health check:** `GET /api/health` → `{ "status": "ok", "service": "IMovies API" }`

---

## ✨ Feature Checklist (SkillWallet instructions)

- ✅ Full CRUD APIs (movies, shows, bookings) with server-side validation
- ✅ JWT authentication with **role-based access** (User + Admin) & protected routes
- ✅ bcrypt password encryption, API middleware, centralized error handling/logging
- ✅ Admin dashboard: movie / theatre / show management (CRUD)
- ✅ Movie search & filtering: title, genre, language, city, date
- ✅ Real-time seat selection & availability tracking (60 seats/show, live seat map)
- ✅ Ticket booking + **payment processing** (demo card gateway) + booking confirmation page
- ✅ Booking history, cancellation with seat release & auto-refund
- ✅ Upcoming & past/cancelled bookings sections
- ✅ Pagination, express rate limiting, MongoDB indexing
- ✅ Toast notifications + responsive Bootstrap UI

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Bootstrap 5, Axios, react-toastify |
| Backend | Node.js, Express.js (REST API), express-rate-limit |
| Database | MongoDB (Atlas) with Mongoose ODM — Users, Movies, Theatres, Shows, Bookings |
| Auth | JSON Web Tokens (JWT) + bcrypt, role-based authorization |
| Architecture | Client–Server, MVC-style separation (models / routes / middleware) |

---

## 📡 API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, returns JWT |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Current user profile |

### Movies, Theatres & Shows
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/movies` | Public | Paginated list (`?search=&genre=&language=&city=&page=&limit=`) |
| GET | `/api/movies/genres` | Public | Distinct genres |
| GET | `/api/movies/languages` | Public | Distinct languages |
| GET | `/api/movies/cities` | Public | Cities with shows |
| GET | `/api/movies/:id` | Public | Movie + its shows (`?date=YYYY-MM-DD`) |
| POST | `/api/movies` | **Admin** | Add movie |
| PUT | `/api/movies/:id` | **Admin** | Update movie |
| DELETE | `/api/movies/:id` | **Admin** | Delete movie + its shows |
| GET | `/api/showtimes` | Public | Shows (`?movieId=&date=&city=`) |
| GET | `/api/showtimes/:id` | Public | One showtime with booked seats |
| POST | `/api/showtimes` | **Admin** | Schedule a show |
| PUT | `/api/showtimes/:id` | **Admin** | Update a show |
| DELETE | `/api/showtimes/:id` | **Admin** | Delete a show (if no bookings) |

### Bookings & Payments
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/bookings` | Private | Book selected seats (real-time availability check, max 10) |
| GET | `/api/bookings/my` | Private | My bookings |
| GET | `/api/bookings/:id` | Private | Booking detail |
| POST | `/api/bookings/:id/pay` | Private | **Pay** (demo card gateway → `paymentStatus: paid`) |
| PUT | `/api/bookings/:id/cancel` | Private | Cancel booking, frees the seats, auto-refund |

---

## 💻 Local Development

### Prerequisites
- **Node.js v16+** and **npm v8+**
- A **MongoDB Atlas** account (free tier): [mongodb.com/atlas](https://www.mongodb.com/atlas)

### 1. Clone & install
```bash
git clone <your-repo-url>
cd imovies

# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 2. Configure environment
```bash
# backend/.env  (copy from backend/.env.example)
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/imovies?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
> In Atlas: create a database user, allow network access from `0.0.0.0/0` (or your IP), and copy the connection string.

### 3. Seed sample data (6 movies + showtimes for the next days)
```bash
cd backend
npm run seed
```

### 4. Run
```bash
# Terminal 1 — API on http://localhost:5000
cd backend && npm run dev

# Terminal 2 — App on http://localhost:5173
cd frontend && npm run dev
```
Open **http://localhost:5173** — the dev server proxies `/api/*` to the backend, so no CORS setup needed locally.

### 🧪 Test flow
1. Sign up → browse movies → pick a showtime → select seats → **Book Now**
2. View/cancel tickets in **My Bookings**
3. Reopen the show's seat map — seats you booked are greyed out for everyone (real-time availability)

---

## ☁️ Deployment — everything on Vercel (free)

**Backend (Vercel serverless):**
1. Go to [vercel.com/new](https://vercel.com/new) → **Import** the `mahimavaishnav/imovies` repo
2. Before deploying, open **Configure → Root Directory** → set to `backend`
3. Set Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = your frontend URL (add after step 4, then redeploy)
4. Deploy → note the URL, e.g. `https://imovies-api.vercel.app` → verify: open `/api/health` in a browser
5. Seed data once from your machine: `MONGO_URI=<your atlas uri> npm run seed`

**Frontend (Vercel static/Vite):**
1. Again at [vercel.com/new](https://vercel.com/new) → **Import** the same repo
2. **Root Directory** → `frontend` (Vercel auto-detects Vite)
3. Environment Variable: `VITE_API_URL` = `https://<your-backend-url>/api`
4. Deploy → this URL is your **Demo Link** for SkillWallet

**Alternative backend hosting:** the repo also contains `render.yaml` for one-click
[Render](https://render.com) deployment if you prefer a always-on server.

### Streamlit bonus dashboard (optional, extra analytics view)
A **Streamlit dashboard** showing live booking stats from the same API ships in `frontend/streamlit_demo.py`, deployable in one click on [Streamlit Cloud](https://share.streamlit.io):
```bash
pip install -r frontend/requirements_streamlit.txt
streamlit run frontend/streamlit_demo.py
```

---

## 📂 Project Structure

```
imovies/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Movie, Showtime, Booking (Mongoose schemas)
│   ├── middleware/auth.js      # JWT protect middleware
│   ├── routes/                 # auth.js, movies.js, bookings.js
│   ├── server.js               # Express app entry
│   └── seed.js                 # Sample movies & showtimes
├── frontend/
│   ├── src/
│   │   ├── api.js              # Axios instance + JWT interceptor
│   │   ├── context/AuthContext # Global auth state
│   │   ├── components/         # Navbar, MovieCard, SeatMap
│   │   └── pages/              # Home, MovieDetail, MyBookings, Login, Register
│   └── vite.config.js
└── README.md
```
