from flask import Flask, jsonify, request, send_from_directory
import a2s
import time
import sqlite3
import os
import re

app = Flask(__name__, static_folder="static", static_url_path="")

SERVER_ADDR = ("84.54.82.234", 27047)

# AMXX sqlite modul shu fayl nomini ("weitcs") ochadi -> weitcs.sq3
# Yo'l odatda: <cs_server>/cstrike/addons/amxmodx/data/sqlite/weitcs.sq3
# MUHIM: bu Flask ilova xuddi shu diskda ishlashi kerak (VPS'da CS 1.6 serveri bilan birga).
DB_PATH = os.environ.get(
    "WEITCS_DB_PATH",
    "/home/cs16/cstrike/addons/amxmodx/data/sqlite/weitcs.sq3"
)

STEAMID_RE = re.compile(r"^STEAM_[0-5]:[01]:\d+$", re.IGNORECASE)

_cache = {"data": None, "ts": 0}
CACHE_TTL = 5  # seconds


def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_tables():
    """Baza hali yaratilmagan bo'lsa ham (plagin birinchi marta ishga tushmagan
    bo'lsa) sayt qulamasligi uchun, bir xil jadvallarni shu yerda ham garantiya qilamiz."""
    conn = get_db()
    conn.execute(
        """CREATE TABLE IF NOT EXISTS wt_players (
        steamid VARCHAR(32) PRIMARY KEY,
        nick VARCHAR(64),
        exp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        win_streak INTEGER DEFAULT 0,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        mvp_count INTEGER DEFAULT 0,
        round_wins INTEGER DEFAULT 0,
        round_losses INTEGER DEFAULT 0,
        registered INTEGER DEFAULT 0,
        registered_at INTEGER DEFAULT 0,
        last_seen INTEGER DEFAULT 0)"""
    )
    conn.commit()
    conn.close()


def query_server():
    now = time.time()
    if _cache["data"] and now - _cache["ts"] < CACHE_TTL:
        return _cache["data"]

    try:
        info = a2s.info(SERVER_ADDR, timeout=3.0)
        players = a2s.players(SERVER_ADDR, timeout=3.0)

        player_list = []
        for p in players:
            if p.name.strip() == "":
                continue
            player_list.append({
                "name": p.name,
                "score": p.score,
                "duration": int(p.duration),
            })
        player_list.sort(key=lambda x: x["score"], reverse=True)

        data = {
            "online": True,
            "name": info.server_name,
            "map": info.map_name,
            "players": info.player_count,
            "max_players": info.max_players,
            "player_list": player_list,
            "ping": None,
        }
    except Exception as e:
        data = {
            "online": False,
            "error": str(e),
        }

    _cache["data"] = data
    _cache["ts"] = now
    return data


@app.route("/api/status")
def status():
    return jsonify(query_server())


# ---------------- FACEIT / REGISTRATION API ----------------

@app.route("/api/register", methods=["POST"])
def register():
    body = request.get_json(silent=True) or {}
    steamid = (body.get("steamid") or "").strip().upper()
    nick = (body.get("nick") or "").strip()

    if not STEAMID_RE.match(steamid):
        return jsonify({"ok": False, "error": "SteamID formati noto'g'ri (STEAM_0:1:12345678 kabi bo'lishi kerak)"}), 400
    if not (2 <= len(nick) <= 32):
        return jsonify({"ok": False, "error": "Nick 2-32 belgi orasida bo'lishi kerak"}), 400

    ensure_tables()
    conn = get_db()

    already = conn.execute("SELECT steamid FROM wt_players WHERE steamid = ?", (steamid,)).fetchone()
    if already:
        conn.close()
        return jsonify({"ok": False, "error": "Bu SteamID allaqachon ro'yxatdan o'tgan"}), 409

    # to'g'ridan-to'g'ri wt_players'ga yoziladi (registered=0).
    # O'yinchi serverga kirgan zahoti plagin registered=1 qilib, hisoblashni boshlaydi.
    conn.execute(
        "INSERT INTO wt_players (steamid, nick, exp, level, win_streak, registered, registered_at, last_seen) "
        "VALUES (?, ?, 0, 0, 0, 0, ?, ?) "
        "ON CONFLICT(steamid) DO UPDATE SET nick = excluded.nick",
        (steamid, nick, int(time.time()), int(time.time())),
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})


@app.route("/api/register/status")
def register_status():
    steamid = (request.args.get("steamid") or "").strip().upper()
    if not STEAMID_RE.match(steamid):
        return jsonify({"ok": False, "error": "SteamID formati noto'g'ri"}), 400

    ensure_tables()
    conn = get_db()
    player = conn.execute("SELECT nick, level, registered FROM wt_players WHERE steamid = ?", (steamid,)).fetchone()
    conn.close()

    if not player:
        return jsonify({"ok": True, "registered": False, "waiting": False})
    return jsonify({
        "ok": True,
        "registered": bool(player["registered"]),
        "waiting": not bool(player["registered"]),
        "nick": player["nick"],
        "level": player["level"],
    })


@app.route("/api/player/<steamid>")
def player_profile(steamid):
    steamid = steamid.strip().upper()
    if not STEAMID_RE.match(steamid):
        return jsonify({"ok": False, "error": "SteamID formati noto'g'ri"}), 400

    ensure_tables()
    conn = get_db()
    p = conn.execute("SELECT * FROM wt_players WHERE steamid = ?", (steamid,)).fetchone()
    if not p:
        conn.close()
        return jsonify({"ok": False, "error": "O'yinchi topilmadi"}), 404

    rank_row = conn.execute(
        "SELECT COUNT(*) + 1 AS rank FROM wt_players WHERE (level, exp) > (?, ?)",
        (p["level"], p["exp"]),
    ).fetchone()
    conn.close()

    total_games = p["round_wins"] + p["round_losses"]
    winrate = round((p["round_wins"] / total_games) * 100, 1) if total_games > 0 else 0.0

    return jsonify({
        "ok": True,
        "steamid": p["steamid"],
        "nick": p["nick"],
        "exp": p["exp"],
        "level": p["level"],
        "win_streak": p["win_streak"],
        "streak_progress": f"{p['win_streak']}/5",
        "deaths": p["deaths"],
        "mvp_count": p["mvp_count"],
        "round_wins": p["round_wins"],
        "round_losses": p["round_losses"],
        "winrate": winrate,
        "rank": rank_row["rank"],
    })


@app.route("/api/top")
def top_players():
    limit = min(int(request.args.get("limit", 20)), 100)

    ensure_tables()
    conn = get_db()
    rows = conn.execute(
        "SELECT steamid, nick, exp, level, win_streak, round_wins, round_losses, mvp_count "
        "FROM wt_players ORDER BY level DESC, exp DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()

    return jsonify({
        "ok": True,
        "players": [dict(r) for r in rows],
    })


# ---------------- PAGES ----------------

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/register")
def register_page():
    return send_from_directory("static", "register.html")


@app.route("/faceit")
def faceit_page():
    return send_from_directory("static", "faceit.html")


@app.route("/leaderboard")
def leaderboard_page():
    return send_from_directory("static", "leaderboard.html")


if __name__ == "__main__":
    ensure_tables()
    app.run(host="0.0.0.0", port=5000, debug=True)
