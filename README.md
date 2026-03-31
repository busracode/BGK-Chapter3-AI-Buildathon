# 🌳 Hayat Ağacı — Tree of Life

> Nesilleri birbirine bağlayan, yapay zeka destekli akıllı mentörlük ve refakat platformu.

## 🌟 Proje Vizyonu

**Hayat Ağacı**, teknolojiyi dışlayıcı değil, kapsayıcı bir araç olarak kullanarak gençlerin dinamizmi ile yaşlıların hayat tecrübesini buluşturur. Yapay zeka, bu köprüde hem bir **akıllı rehber** hem de bir **güvenlik nöbetçisi** görevini üstlenir.

## 🛠️ Uygulama Özellikleri

### 1. Akıllı Kayıt ve Tanıma (AI Onboarding)
- **Kuşaklararası Ayrım**: Gençler için standart, yaşlılar için ses odaklı kayıt akışları.
- **Sesli Profil Oluşturma**: Yaşlı kullanıcılar yazmak yerine konuşarak kendilerini tanıtır; AI bu konuşmadan hobileri, şehirleri ve uzmanlık alanlarını otomatik ayıklar.
- **Resimli Şifre (Picture Password)**: Hatırlaması zor metin şifreler yerine, yaşlı dostu ikon dizileriyle güvenli giriş.

### 2. Mentör Keşfi ve AI Uyumu (Discovery)
- **Mentör Havuzu**: Gençler tüm mentörleri uzmanlık alanlarına göre filtreleyebilir ve listeleyebilir.
- **Konu Bazlı İstek**: "Üniversite tercihi" veya "Yalnızlık hissi" gibi spesifik başlıklarla istek gönderme.
- **Uzmanlık Analizi (Alignment Score)**: AI, öğrencinin ihtiyacı ile mentörün tecrübesini karşılaştırarak %0-100 arası bir uyum puanı üretir.

### 3. Sohbet ve Güvenlik (Chat & Moderation)
- **Gerçek Zamanlı İletişim**: Kesintisiz mesajlaşma ve mesaj geçmişi kaydı.
- **AI Moderasyon**: Sohbetler uçtan uca taranarak intihar, kendine zarar verme veya saldırganlık gibi riskli durumlar tespit edilir.
- **Kriz Bildirim Servisi**: Riskli konuşmalarda sistem otomatik olarak uzman ekiplere ve acil durum rehberine bildirim gönderir.

### 4. Günlük Yaşam ve Takip (Tracking)
- **Duygu Durum (Mood) Analizi**: Kullanıcılar günlük modlarını emoji veya sesle günceller. AI, bu girdileri analiz ederek öneriler sunar.
- **Haftalık İlerleme (Weekly Progress)**: 1-10 arası günlük puanlama ve ilerlemeyi gösteren interaktif SVG grafiği.
- **Dijital Günlük**: Kullanıcıların anılarını veya o günkü derslerini kaydedebileceği alan.

### 5. Maksimum Erişilebilirlik (Elder-Friendly)
- **Global Ölçeklendirme**: Tek tuşla tüm fontların, ikonların ve butonların dev boyutlara (min 22px) çekilmesi.
- **Sesli Asistan (TTS)**: Tüm mesajların ve bildirimlerin sesli olarak okunabilmesi.
- **Ses Tanıma (STT)**: Yazı yazmakta zorlanan kullanıcılar için tüm girdi alanlarında mikrofon desteği.

### 6. Dinamik Profil Yönetimi
- **AI Biyografi**: Kullanıcının paylaştığı yeni bilgilerle otomatik güncellenen "Yapay Zeka Özeti".
- **Acil Durum Kişisi**: Yaşlı kullanıcılar için hızlı erişilebilir acil durum iletişim bilgileri.

## 🔧 Teknik Mimari

- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion.
- **Backend**: FastAPI (Python) + SQLAlchemy.
- **Zeka Katmanı**: NLP ve Duygu Analizi modelleri.
- **Veritabanı**: SQLite (Yerel) / PostgreSQL (Üretim).

## 📦 Başlangıç

### Gerekli Kurulumlar
- Node.js (v18+)
- Python (v3.10+)

### Hızlı Başlat (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### Hızlı Başlat (Backend)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

🔗 **İletişim**: [hayatagaci.app](https://hayatagaci.app)

