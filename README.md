# 🌳 Hayat Ağacı — Tree of Life
> Nesilleri birbirine bağlayan, yapay zeka destekli akıllı mentörlük ve refakat platformu.

[![🌐 Canlı Demo](https://img.shields.io/badge/🌐%20Canlı%20Demo-bgk--chapter3--ai--buildathon.vercel.app-4CAF50?style=for-the-badge&logo=vercel&logoColor=white)](https://bgk-chapter3-ai-buildathon.vercel.app/)
🔗[📺 Demo Videosunu İzlemek İçin Tıklayın](https://www.youtube.com/watch?v=SLz_BALeY0Q)

---

## 📌 Problem ve Vizyon

Günümüz toplumunda iki büyük sosyal problem, aslında birbirinin ilacıdır:

1. **Gençlerin Rehberlik İhtiyacı:** Kariyer, kişisel gelişim ve hayatın karmaşasında tecrübesizlikten kaynaklanan belirsizlik ve yalnızlık hissi.
2. **Yaşlıların Sosyal İzolasyonu:** Hayat tecrübesini aktaracak mecra bulamama ve buna bağlı olarak gelişen "işe yaramazlık" veya "boşa yaşama" duygusu.

**Çözüm:** *Hayat Ağacı*, bu iki problemi "birbirine kırdırarak" çözer. Yaşlıların bilgelik ihtiyacını gençlerin dinamizmiyle buluşturan, yapay zeka ile optimize edilmiş bir köprü inşa eder.

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

