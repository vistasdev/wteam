# WEIT CS — Websayt

## Ishga tushirish

```bash
pip install -r requirements.txt
python app.py
```

Sayt: http://localhost:5000

## Fayllar

- `app.py` — Flask backend, `/api/status` orqali A2S protokoli bilan serverdan
  jonli o'yinchilar va xarita ma'lumotini oladi (84.54.82.234:27047).
- `static/index.html` — bosh sahifa (hero, server holati, o'yinchilar jadvali, VIP, ijtimoiy tarmoqlar)
- `static/style.css` — dizayn (dark/tactical uslub, oltin aksent)
- `static/script.js` — frontend logika: har 5 soniyada statusni yangilash, toast xabarlar, IP nusxalash

## Eslatma

Server IP-ni o'zgartirish uchun `app.py` faylidagi `SERVER_ADDR` qatorini tahrirlang.
Agar hostingda UDP portlar bloklangan bo'lsa (masalan ba'zi shared hostinglar),
`/api/status` xatolik qaytarishi mumkin — bu holda VPS yoki UDP'ga ruxsat beruvchi
hosting tanlang (Render, VPS, Railway va h.k.).
# weitcs
