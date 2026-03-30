# 🗺️ user-flow.md — Kullanıcı Akışı

## Genel Akış Diyagramı

```
[Uygulama Açılır]
       │
       ▼
[Rol Seçimi: Genç / Büyük]
       │
       ├──► GENÇ AKIŞI
       │
       └──► BÜYÜK AKIŞI
```

---

## Genç Kullanıcı Akışı (18–35 yaş)

```
1. KAYIT & PROFİL OLUŞTURMA
   ├─ Ad, yaş, şehir
   ├─ "Şu an ne hissediyorsun?" (duygu seçimi)
   ├─ İlgi alanları & yaşadığın zorluk kategorisi
   └─ AI → Duygu Puanı & Tecrübe Etiketi oluşturur

2. AI EŞLEŞTİRME ÖNERİSİ
   ├─ "Seninle %94 rezonans eden biri var"
   ├─ Büyük kullanıcının kısa profili gösterilir
   ├─ [Kabul Et] veya [Başka Öneri İste]
   └─ Kabul → Randevu/sohbet başlar

3. SOHBET
   ├─ Sesli veya yazılı mesajlaşma
   ├─ AI arka planda çalışır (görünmez moderasyon)
   ├─ AI öngörü baloncukları (isteğe bağlı göster/gizle)
   └─ Sohbet bitiş → "Bu oturumu kaydetmek ister misin?"

4. DİJİTAL GÜNLÜK
   ├─ AI sohbetten dersleri çıkarır
   ├─ Kullanıcı düzenleyebilir / onaylayabilir
   └─ Günlük arşivine eklenir

5. GERİ BİLDİRİM & DEVAM
   ├─ Oturum değerlendirmesi (1–5 yıldız)
   ├─ "Tekrar görüşmek ister misin?"
   └─ Yeni eşleştirme veya aynı mentor ile devam
```

---

## Büyük Kullanıcı Akışı (60+ yaş)

```
1. KAYIT (basitleştirilmiş)
   ├─ Ad, yaş, şehir
   ├─ Sesli kayıt: "Hayatında en çok neyi öğrendin?"
   ├─ AI → Hikaye haritası & Tecrübe Etiketleri oluşturur
   └─ Profil fotoğrafı (isteğe bağlı)

2. BÜYÜK BOY PANEL EKRANI
   ├─ "Bugün seninle konuşmak isteyen biri var"
   ├─ Büyük düğme: [KABUL ET] veya [DAHA SONRA]
   └─ Sesli onay da mümkün: "Evet" komutu

3. SOHBET
   ├─ Sesli arama öncelikli
   ├─ Yazı yazma için büyük klavye
   ├─ Ekran büyütme otomatik
   └─ AI, sohbet akışını sessizce yönlendirir

4. MİRAS GÜNLÜĞÜ
   ├─ "Bu sohbetten bir ders çıktı"
   ├─ AI metni okuyor (text-to-speech)
   ├─ Büyük onaylar veya düzeltir
   └─ "Ailene göndermek ister misin?" seçeneği

5. DESTEK & GÜVENLİK
   ├─ Kriz tespiti → sessiz uzman bildirimi
   └─ Acil durum butonu: [AİLEMİ ARA]
```

---

## AI Moderasyon Akışı (Arka Plan)

```
[Her mesaj gelir]
        │
        ▼
[NLP analizi: duygu + kriz belirteci tarama]
        │
        ├─ Normal → sohbet devam
        │
        ├─ Şüpheli → AI öngörü etiketi ekler
        │
        └─ Kriz tespit edildi
                  │
                  ├─ Genç: intihar/zarar eğilimi → moderatöre bildirim (gizli)
                  └─ Büyük: demans belirtisi → vasi/aile bildirimi (gizli)
```

---

## Ekran Listesi

| Ekran | Platform | Açıklama |
|-------|----------|----------|
| Splash / Rol Seçimi | Her ikisi | İlk açılış |
| Kayıt & Profil | Her ikisi | Kullanıcı oluşturma |
| Ana Sayfa | Mobil | AI önerisi + son oturumlar |
| Büyük Panel | Tablet | Sade, büyük düğmeli ana ekran |
| Sohbet | Her ikisi | Mesajlaşma + AI öngörü |
| Dijital Günlük | Mobil | Ders arşivi |
| Miras Günlüğü | Tablet | Büyük kullanıcı ders arşivi |
| Profil & Güvenlik | Her ikisi | Ayarlar, gizlilik, kriz butonu |
