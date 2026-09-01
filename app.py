from flask import Flask, jsonify, send_from_directory
import a2s
import time

app = Flask(__name__, static_folder="static", static_url_path="")

SERVER_ADDR = ("84.54.82.234", 27047)

_cache = {"data": None, "ts": 0}
CACHE_TTL = 5  # seconds


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
        # eng ko'p score bo'yicha saralash
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


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
