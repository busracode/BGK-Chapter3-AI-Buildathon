# ⚙️ tech-stack.md — Teknoloji Yığını

## Genel Mimari

```
┌─────────────────────────────────────────────────────┐
│                   KULLANICI KATMANI                 │
│  React Native (Mobil)    Tablet Web Panel (React)   │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS / WebSocket
┌───────────────────▼─────────────────────────────────┐
│                  API GATEWAy                        │
│              FastAPI (Python)                       │
│     REST + WebSocket + Background Tasks             │
└──────┬───────────────────────┬──────────────────────┘
       │                       │
┌──────▼──────┐       ┌────────▼────────┐
│  NLP Motoru │       │   Güvenlik      │
│  (Anthropic │       │   Katmanı       │
│   Claude)   │       │ (Şifreleme +    │
│             │       │  Moderasyon)    │
└──────┬──────┘       └────────┬────────┘
       │                       │
┌──────▼───────────────────────▼──────────────────────┐
│                   VERİ KATMANI                      │
│     PostgreSQL (Ana DB)   Redis (Cache/Session)     │
└─────────────────────────────────────────────────────┘
```

---

## Frontend

### React (Web / Tablet Panel)

| Teknoloji | Versiyon | Neden? |
|-----------|----------|--------|
| React | 18.x | Komponent tabanlı, ekosistem zenginliği |
| React Router | 6.x | SPA navigasyonu |
| TailwindCSS | 3.x | Hızlı, tutarlı UI geliştirme |
| Zustand | 4.x | Hafif state yönetimi (Redux'tan sade) |
| Socket.io Client | 4.x | Gerçek zamanlı sohbet |
| Axios | 1.x | HTTP istekleri |

**Neden React Native değil web için?**
Yaşlı kullanıcıların tablet üzerinden tarayıcı ile ulaşması daha düşük bariyer oluşturur. Uygulama indirme zorunluluğu kaldırılır.

### React (Mobil — Genç Kullanıcı)

| Teknoloji | Versiyon | Neden? |
|-----------|----------|--------|
| React Native | 0.74 | iOS + Android tek kod tabanı |
| Expo | 51 | Hızlı geliştirme ve dağıtım |
| React Navigation | 6.x | Mobil navigasyon standartı |

---

## Backend

### Python / FastAPI

| Teknoloji | Versiyon | Neden? |
|-----------|----------|--------|
| FastAPI | 0.110 | Hız, otomatik dokümantasyon, async destek |
| Uvicorn | 0.29 | ASGI sunucusu |
| Celery | 5.x | Arka plan görevleri (AI analizi, bildirim) |
| SQLAlchemy | 2.x | ORM, async desteği |
| Alembic | 1.x | Veritabanı migrasyon yönetimi |
| Pydantic | 2.x | Veri doğrulama ve şema |

**Neden FastAPI?**
Python ekosistemi NLP/AI kütüphaneleriyle doğrudan entegrasyon sağlar. Asenkron yapısı WebSocket tabanlı sohbet için idealdir.

---

## AI / NLP Katmanı

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Anthropic Claude API** | Duygu analizi, eşleştirme skoru, ders kristalizasyonu |
| **spaCy (TR)** | Türkçe token analizi ve varlık tespiti |
| **TextBlob / transformers** | Duygu sınıflandırma (sentiment) |
| **Whisper (OpenAI)** | Sesli konuşmadan metin (yaşlı kullanıcı) |
| **gTTS / ElevenLabs** | Metinden sese (büyük kullanıcı için AI okuma) |

### Duygu Puanı Hesaplama

```python
# Basitleştirilmiş akış
def compute_emotion_score(text: str) -> EmotionProfile:
    # 1. Duygu sınıfı: kaygı / hüzün / umut / kafa karışıklığı
    emotion = classify_emotion(text)
    # 2. Kriz belirteci tarama
    crisis_flag = detect_crisis_markers(text)
    # 3. Tecrübe etiketi çıkarma (Claude API)
    tags = extract_experience_tags(text)
    return EmotionProfile(emotion=emotion, crisis=crisis_flag, tags=tags)
```

---

## Veritabanı

### PostgreSQL — Ana Veritabanı

| Tablo | İçerik |
|-------|--------|
| `users` | Kullanıcı profilleri (şifreli) |
| `emotion_profiles` | Duygu puanları ve tecrübe etiketleri |
| `matches` | Eşleştirme kayıtları ve rezonans skorları |
| `sessions` | Sohbet oturumu meta verisi |
| `messages` | Şifreli mesaj içerikleri |
| `journal_entries` | AI tarafından kristalize edilen dersler |
| `crisis_events` | Moderasyon olayları (kısıtlı erişim) |

### Redis — Cache & Session

- Oturum token'ları
- Aktif WebSocket bağlantı haritası
- Rate limiting sayaçları

---

## Güvenlik

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Kimlik doğrulama | JWT + Refresh Token | Stateless, güvenli |
| Şifreleme (transit) | TLS 1.3 | Tüm API trafiği |
| Şifreleme (rest) | AES-256 | Mesaj içerikleri DB'de şifreli |
| Anonimleştirme | k-anonymity | PII veriler anonimleştirilir |
| Rate limiting | Redis + FastAPI middleware | DDoS ve spam koruması |
| Moderasyon | Claude API + kural motoru | Gerçek zamanlı kriz tespiti |

---

## DevOps

| Teknoloji | Kullanım |
|-----------|---------|
| Docker + Docker Compose | Konteynerizasyon |
| GitHub Actions | CI/CD pipeline |
| AWS EC2 / ECS | Hosting |
| AWS RDS | PostgreSQL yönetilen servis |
| AWS ElastiCache | Redis yönetilen servis |
| Sentry | Hata takibi |
| Prometheus + Grafana | Metrik izleme |

---

## Teknoloji Seçim Gerekçesi Özeti

**Python backend:** AI/NLP entegrasyonu için en olgun ekosistem. Claude, spaCy, Whisper hepsi Python-native.

**React:** Hem web (yaşlı tablet paneli) hem mobil (genç uygulaması) için tek ekip, tek dil.

**PostgreSQL:** İlişkisel yapı, güçlü JSON desteği, HIPAA uyumlu şifreleme imkânı.

**Anthropic Claude:** Türkçe dil anlayışı, güvenlik odaklı model politikası, moderasyon güvenilirliği.
