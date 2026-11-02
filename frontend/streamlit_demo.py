"""
IMovies — Streamlit live demo dashboard
Connects to the IMovies Express API (Express + MongoDB) and shows movies,
showtimes and real-time seat availability.

Deploy on Streamlit Cloud:
    1. Put this repo on GitHub
    2. share.streamlit.io -> New app -> main file: frontend/streamlit_demo.py
    3. If your API is live, set the API URL in .streamlit/secrets.toml:
           API_URL = "https://your-render-app.onrender.com/api"
       Otherwise the dashboard auto-falls back to DEMO data.

Run locally:
    pip install -r requirements_streamlit.txt
    streamlit run streamlit_demo.py
"""

import os
from collections import Counter

import requests
import streamlit as st

API_URL = (
    (st.secrets.get("API_URL") if hasattr(st, "secrets") else None)
    or os.getenv("API_URL", "http://localhost:5000/api")
)

# ─── DEMO data (used only when the real API is unreachable) ───
DEMO_MOVIES = [
    {"_id": "1", "title": "Dune: Part Two", "description": "Paul Atreides unites with the Fremen to wage war against the Harkonnens and avert his terrible future.", "genre": ["Sci-Fi", "Adventure"], "language": "English", "duration": 166, "releaseYear": 2024, "poster": "https://image.tmdb.org/t/p/w500/1pdflvkbX9fNJUB2G9kVgmx5Ntl.jpg"},
    {"_id": "2", "title": "Oppenheimer", "description": "The story of J. Robert Oppenheimer and the creation of the atomic bomb during World War II.", "genre": ["Drama", "History"], "language": "English", "duration": 180, "releaseYear": 2023, "poster": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"},
    {"_id": "3", "title": "Inception", "description": "A thief who steals corporate secrets through dream-sharing technology is planted an idea.", "genre": ["Sci-Fi", "Thriller"], "language": "English", "duration": 148, "releaseYear": 2010, "poster": "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"},
    {"_id": "4", "title": "Interstellar", "description": "Explorers travel through a wormhole in space to ensure humanity's survival.", "genre": ["Sci-Fi", "Drama"], "language": "English", "duration": 169, "releaseYear": 2014, "poster": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"},
    {"_id": "5", "title": "The Dark Knight", "description": "Batman faces the Joker, a criminal mastermind who plunges Gotham City into chaos.", "genre": ["Action", "Crime"], "language": "English", "duration": 152, "releaseYear": 2008, "poster": "https://image.tmdb.org/t/p/w500/qJ2tW6WMCDuxEVa2yXk4Z43d29y.jpg"},
    {"_id": "6", "title": "RRR", "description": "A legendary Indian action epic about two revolutionaries and their fight against the British Raj.", "genre": ["Action", "Drama"], "language": "Telugu", "duration": 187, "releaseYear": 2022, "poster": "https://image.tmdb.org/t/p/w500/eOHpHaso2B3Q60bI1dACq90Ga6d.jpg"},
]

def demo_showtimes(m):
    out = []
    for date in ["2026-11-03", "2026-11-04"]:
        for i, time in enumerate(["10:30 AM", "06:30 PM"]):
            out.append({
                "date": date, "time": time,
                "theater": ["PVR Cinemas", "IMAX Grand"][i],
                "bookedSeats": [f"{r}{s}" for r in "ABCDEF" for s in range(1, 11) if (hash(m["_id"] + r + s + date + time)) % 11 < 3],
            })
    return out


@st.cache_data(ttl=30)
def fetch(path: str):
    r = requests.get(f"{API_URL}{path}", timeout=5)
    r.raise_for_status()
    return r.json()


st.set_page_config(page_title="IMovies Live Dashboard", page_icon="🎬", layout="wide")
st.title("🎬 IMovies — Live Booking Dashboard")
st.caption("Real-time view of the IMovies MERN API (Express + MongoDB)")

live = False
try:
    health = fetch("/health")
    live = True
    st.success(f"🟢 LIVE — API is {health['status'].upper()} · {health['service']}")
except Exception:
    st.warning("🟡 DEMO MODE — API not reachable, showing sample data. "
               "Set API_URL in Streamlit secrets to switch to live data.")

movies = DEMO_MOVIES if not live else fetch("/movies")

showtimes = []
for m in movies:
    if live:
        showtimes += fetch(f"/movies/{m['_id']}")["showtimes"]
    else:
        showtimes += demo_showtimes(m)

# ---------- KPIs ----------
c1, c2, c3, c4 = st.columns(4)
booked = sum(len(s["bookedSeats"]) for s in showtimes)
capacity = len(showtimes) * 60
c1.metric("🎞 Movies live", len(movies))
c2.metric("⏰ Showtimes", len(showtimes))
c3.metric("🎟 Tickets sold", booked)
c4.metric("📈 Occupancy", f"{booked / capacity:.0%}" if capacity else "0%")

st.divider()

# ---------- Movie explorer ----------
search = st.text_input("🔎 Search movies")
genres = st.multiselect("Filter by genre", sorted({g for m in movies for g in m["genre"]}))

for m in movies:
    if search.lower() in m["title"].lower() and (not genres or set(genres) & set(m["genre"])):
        with st.container(border=True):
            col_img, col_txt = st.columns([1, 3])
            col_img.image(m["poster"], width=160)
            col_txt.subheader(m["title"])
            col_txt.write(m["description"][:160] + "…")
            col_txt.caption(f"{m['language']} · {m['duration']} min · {m['releaseYear']} · {', '.join(m['genre'])}")
            shows = demo_showtimes(m) if not live else fetch(f"/movies/{m['_id']}")["showtimes"]
            for s in shows[:4]:
                avail = 60 - len(s["bookedSeats"])
                col_txt.markdown(
                    f"`{s['date']}` **{s['time']}** · {s['theater']} · {avail}/60 seats free"
                )
            with col_txt:
                st.bar_chart({
                    s["time"]: {s["date"]: 60 - len(s["bookedSeats"])}
                    for s in shows
                })

st.divider()

# ---------- Which time slots sell out fastest ----------
st.subheader("🏆 Tickets sold by show time")
slot = Counter()
for s in showtimes:
    slot[s["time"]] = slot.get(s["time"], 0) + len(s["bookedSeats"])
st.bar_chart(dict(slot))
