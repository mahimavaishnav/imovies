"""
IMovies — Streamlit live demo dashboard
Connects to the IMovies Express API and shows movies, showtimes and
real-time seat availability. Deployable on Streamlit Cloud in one click.

Run locally:
    pip install -r requirements_streamlit.txt
    streamlit run streamlit_demo.py
"""

import os
from collections import Counter

import requests
import streamlit as st

API_URL = os.getenv("API_URL", "http://localhost:5000/api")


@st.cache_data(ttl=30)
def fetch(path: str):
    r = requests.get(f"{API_URL}{path}", timeout=10)
    r.raise_for_status()
    return r.json()


st.set_page_config(page_title="IMovies Live Dashboard", page_icon="🎬", layout="wide")
st.title("🎬 IMovies — Live Booking Dashboard")
st.caption("Real-time view of the IMovies MERN API (Express + MongoDB)")

try:
    health = fetch("/health")
    st.success(f"API is {health['status'].upper()} · {health['service']}")
except Exception:
    st.error(f"Cannot reach IMovies API at {API_URL} — make sure the backend is running (or set the API_URL environment variable when deploying).")
    st.stop()

movies = fetch("/movies")

# ---------- KPIs ----------
c1, c2, c3, c4 = st.columns(4)
showtimes = []
for m in movies:
    detail = fetch(f"/movies/{m['_id']}")
    showtimes += detail["showtimes"]

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
            detail = fetch(f"/movies/{m['_id']}")
            for s in detail["showtimes"][:4]:
                avail = 60 - len(s["bookedSeats"])
                col_txt.markdown(
                    f"`{s['date']}` **{s['time']}** · {s['theater']} · "
                    f"{avail}/60 seats free"
                )
            with col_txt:
                st.bar_chart(
                    {
                        s["time"]: {date: 60 - len(x["bookedSeats"])}
                        for date, x in [
                            (sh["date"], sh)
                            for sh in detail["showtimes"]
                        ]
                    }
                )

st.divider()

# ---------- Which time slots sell out fastest ----------
slot_bookings = Counter()
for s in showtimes:
    slot_bookings[s["time"]] = slot_bookings.get(s["time"], 0) + len(s["bookedSeats"])
st.subheader("🏆 Tickets sold by show time")
st.bar_chart(dict(slot_bookings))
