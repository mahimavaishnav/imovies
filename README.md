# 🎬 IMovies — Movie Ticket Booking Made Simple

A seamless online platform that enhances the cinema experience by allowing users to browse movies, select showtimes, and reserve seats with **real-time availability tracking**. Built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js) and protected with **JWT authentication**.

> ✨ Features: secure user authentication · booking management · interactive seat picker · intuitive responsive interface (Bootstrap)

---

## 🚀 Live Demo

| Resource | Link |
|---|---|
| 🌐 Frontend (live) | _paste your Vercel/Netlify URL here after deploying_ |
| ⚙️ Backend API (live) | _paste your Render URL here after deploying_ |
| 🐙 GitHub repo | https://github.com/mahimavaishnav/imovies |

**Health check:** `GET /api/health` → `{ "status": "ok", "service": "IMovies API" }`

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Bootstrap 5, Axios |
| Backend | Node.js, Express.js (REST API) |
| Database | MongoDB (Atlas) with Mongoose ODM |
| Auth | JSON Web Tokens (JWT) + bcrypt password hashing |
| Architecture | Client–Server, MVC-style separation (models / routes / middleware) |

---

## 📡 API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, returns JWT |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Private | Current user profile |

### Movies & Showtimes
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/movies` | Public | All movies (`?search=&genre=` filters) |
| GET | `/api/movies/genres` | Public | Distinct genres |
| GET | `/api/movies/:id` | Public | Movie + its showtimes + seat layout |
| GET | `/api/showtimes/:id` | Public | One showtime with booked seats |

### Bookings
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/bookings` | Private | Book selected seats (real-time availability check) |
| GET | `/api/bookings/my` | Private | My bookings |
| PUT | `/api/bookings/:id/cancel` | Private | Cancel booking, frees the seats |

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

## ☁️ Deployment (free tier)

### Backend → [Render](https://render.com)
1. New → **Web Service** → connect your GitHub repo
2. Root directory: `backend` · Build: `npm install` · Start: `npm start`
3. Environment variables: set all values from `.env` (use your Render URL for `CLIENT_URL`)
4. After the first deploy, open **Shell** in Render and run `npm run seed` once to load data.

### Frontend → [Vercel](https://vercel.com)
1. Import repo → set root directory `frontend`
2. Environment variable: `VITE_API_URL=https://<your-render-app>.onrender.com/api`
3. Deploy → copy the URL into the backend `CLIENT_URL` variable and redeploy the API.

### Streamlit alternative demo (optional)
A tiny **Streamlit dashboard** showing live booking stats from the same API ships in `frontend/streamlit_demo.py`, deployable in one click on [Streamlit Cloud](https://share.streamlit.io):
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
