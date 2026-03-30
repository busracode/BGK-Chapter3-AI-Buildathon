# 🌉 Hayat Köprüsü — Life Bridge

> AI destekli kuşaklararası mentörlük platformu

## Problem

Günümüzde iki kritik grup birbirinden kopuk yaşıyor:

- **Gençler (18–35):** Kaygı, kafa karışıklığı, yön kaybı yaşıyor; yüzeysel sosyal medya ilişkileri gerçek rehberliğin yerini tutmuyor.
- **Yaşlılar (60+):** Yalnızlık, anlamsızlık ve miras bırakamama hissiyle boğuşuyor; onlarca yıllık birikim aktarılamıyor.

## Çözüm

**Hayat Köprüsü**, yapay zekanın **Akıllı Eşleştirici** ve **Güvenlik Moderatörü** rolünü üstlendiği, bu iki nesli güvenli ve anlamlı bir dijital ortamda buluşturan bir mentörlük platformudur.

## Temel Özellikler

- **AI Derin Eşleştirme** — Duygusal rezonansa göre birebir eşleştirme
- **Gerçek Zamanlı Moderasyon** — Kriz anı tespiti ve uzman bildirimi
- **Dijital Günlük** — Sohbetlerden kristalize edilen hayat dersleri
- **Çift Arayüz** — Yaşlılar için ses+dokunmatik, gençler için mobil uygulama
- **Uçtan Uca Güvenlik** — Anonimleştirilmiş ve şifreli kullanıcı verileri

## Nasıl Çalıştırılır?

### Gereksinimler

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Frontend (React)

```bash
cd frontend
npm install
npm start
# http://localhost:3000
```

### Backend (Python/FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# http://localhost:8000
```

### Ortam Değişkenleri

```bash
cp .env.example .env
# .env dosyasını düzenle:
# ANTHROPIC_API_KEY=your_key
# DATABASE_URL=postgresql://...
# SECRET_KEY=your_secret
```

## Yayın Linki

🔗 [hayatkoprusu.app](https://hayatkoprusu.app) *(demo)*

## Lisans

MIT © 2026 Hayat Köprüsü Ekibi
