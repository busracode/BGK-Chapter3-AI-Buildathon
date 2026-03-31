# backend/services/nlp_engine.py
"""
NLP Motoru — Hayat Ağacı
Duygu analizi, eşleştirme skoru ve kriz tespiti
"""

from groq import AsyncGroq
from dataclasses import dataclass
from config import settings

# New dataclass for extracting young user profile information
@dataclass
class YoungProfileExtract:
    hobbies: list[str]
    interests: list[str]
    life_experiences: list[str]

from enum import Enum
from typing import Optional
import json
import os


class EmotionType(str, Enum):
    ANXIETY = "kaygı"
    SADNESS = "hüzün"
    CONFUSION = "kafa_karışıklığı"
    HOPE = "umut"
    GRIEF = "yas"
    NEUTRAL = "nötr"


class CrisisLevel(str, Enum):
    NONE = "yok"
    WATCH = "dikkat"
    ALERT = "uyarı"
    CRITICAL = "kritik"


@dataclass
class EmotionProfile:
    primary_emotion: EmotionType
    intensity: float          # 0.0 – 1.0
    crisis_level: CrisisLevel
    experience_tags: list[str]
    summary: str


@dataclass
class ResonanceScore:
    score: float              # 0.0 – 100.0
    reason: str
    shared_themes: list[str]

@dataclass
class ElderProfileExtract:
    name: str
    surname: str
    age: int
    city: str
    life_experiences: list[str]
    hobbies: list[str]
    interests: list[str]
    speaking_style: str
    expertise_level: str
    personality_summary: str


# Initialize AsyncGroq client using settings from .env
client = AsyncGroq(
    api_key=settings.GROQ_API_KEY or "dummy_fallback_key",
    timeout=10.0 # Prevent hanging
)
GROQ_MODEL = "llama-3.3-70b-versatile"  # Ücretsiz, güçlü model


async def extract_elder_profile(text: str) -> ElderProfileExtract:
    """Extract elder profile from transcript (existing)"""
    # (function body unchanged)  # placeholder to keep line numbers
    """Yaşlının sesli anlatımını ayrıştırıp yapılandırılmış JSON döner."""
    prompt = f"""
Sen bir profil uzmanısın. Yaşlı bir mentörün sesli kaydından (transkript) bilgilerini JSON olarak çıkar.
Metin genellikle 'Benim adım Ahmet Yılmaz', 'Ben Ayşe teyze' veya 'İsmim Mehmet' gibi başlar.

Şu bilgileri mutlaka bul:
- "name": Kişinin ismi
- "surname": Kişinin soyismi (varsa)
- "age": Yaş (sayı)
- "city": Yaşadığı şehir
- "life_experiences": Hayat tecrübeleri (liste)
- "hobbies": Hobiler (liste)
- "interests": Özel ilgi alanları (liste)
- "speaking_style": Konuşma tarzı (sakin, heyecanlı, bilgece vb.)
- "expertise_level": Uzmanlık seviyesi/alanı (örneğin mühendislikte 40 yıl, çocuk eğitimi vb.)
- "personality_summary": 1-2 cümlelik karakter özeti

Metin: "{text}"

Gereksinimler:
1. JSON formatı hatasız olmalı.
2. Bilgi yoksa tahminde bulun, boş bırakma.
3. SADECE TÜRKÇE cevap ver ve sadece Türk alfabesini kullan. Başka alfabe veya dilde kelime kesinlikle kullanma.
4. Sadece JSON döndür.
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content.strip())
        print(f"DEBUG: NLP Extracted detailed data: {data}")
        
        return ElderProfileExtract(
            name=data.get("name", "Bilinmiyor"),
            surname=data.get("surname", ""),
            age=int(data.get("age", 0)) if data.get("age") else 0,
            city=data.get("city", "Bilinmiyor"),
            life_experiences=data.get("life_experiences", []),
            hobbies=data.get("hobbies", []),
            interests=data.get("interests", []),
            speaking_style=data.get("speaking_style", "Normal"),
            expertise_level=data.get("expertise_level", "Genel"),
            personality_summary=data.get("personality_summary", ""),
        )
    except Exception as e:
        print(f"DEBUG: NLP Extraction Error: {e}")
        return ElderProfileExtract(
            name="Bilinmiyor",
            surname="",
            age=0,
            city="Bilinmiyor",
            life_experiences=[],
            hobbies=[],
            interests=[],
            speaking_style="Normal",
            expertise_level="Genel",
            personality_summary="",
        )

async def analyze_emotion(text: str, user_role: str) -> EmotionProfile:
    """Existing function unchanged"""
    # (body unchanged)

    """
    Kullanıcının mesajından duygu profili çıkarır.
    Kriz belirteci varsa CrisisLevel.ALERT veya CRITICAL döner.
    """
    prompt = f"""
Sen bir klinik duygu analiz asistanısın. Aşağıdaki metni analiz et.

Kullanıcı rolü: {user_role}
Metin: "{text}"

Şu bilgileri JSON formatında ver:
{{
  "primary_emotion": "kaygı|hüzün|kafa_karışıklığı|umut|yas|nötr",
  "intensity": 0.0-1.0,
  "crisis_level": "yok|dikkat|uyarı|kritik",
  "experience_tags": ["etiket1", "etiket2"],
  "summary": "kısa özet"
}}

Kriz seviyesi için:
- "yok": Normal konuşma
- "dikkat": Hafif sıkıntı belirtileri
- "uyarı": Belirgin stres veya demans belirtisi
- "kritik": İntihar, kendine zarar verme, şiddetli kognitif bozulma

SADECE TÜRKÇE CEVAP VER. Başka alfabe veya dil kullanma.
Sadece JSON döndür, başka metin ekleme.
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)

    return EmotionProfile(
        primary_emotion=EmotionType(data["primary_emotion"]),
        intensity=data["intensity"],
        crisis_level=CrisisLevel(data["crisis_level"]),
        experience_tags=data["experience_tags"],
        summary=data["summary"],
    )


async def compute_resonance_score(
    young_profile: EmotionProfile,
    elder_profile: EmotionProfile,
) -> ResonanceScore:
    """Existing function unchanged"""
    # (body unchanged)

    """
    Genç ve yaşlı profilleri arasındaki duygusal rezonans skorunu hesaplar.
    """
    prompt = f"""
İki kullanıcı arasındaki duygusal rezonans skorunu hesapla.

Genç kullanıcı profili:
- Duygu: {young_profile.primary_emotion}
- Etiketler: {', '.join(young_profile.experience_tags)}
- Özet: {young_profile.summary}

Yaşlı kullanıcı profili:
- Duygu: {elder_profile.primary_emotion}
- Etiketler: {', '.join(elder_profile.experience_tags)}
- Özet: {elder_profile.summary}

JSON formatında ver:
{{
  "score": 0-100,
  "reason": "eşleştirme gerekçesi (1 cümle)",
  "shared_themes": ["ortak tema 1", "ortak tema 2"]
}}

Sadece JSON döndür.
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)

    return ResonanceScore(
        score=data["score"],
        reason=data["reason"],
        shared_themes=data["shared_themes"],
    )

async def compute_interest_resonance(
    young_data: dict,
    elder_data: dict,
) -> ResonanceScore:
    """
    Genç ve yaşlı kullanıcılar arasındaki ilgi alanı, hobi ve tecrübe uyumunu hesaplar.
    """
    prompt = f"""
İki kullanıcı arasındaki ilgi alanı, hobi ve hayat tecrübesi uyumunu hesapla.
Duygusal durumlarını GÖRMEZDEN GEL, sadece ortak ilgi alanlarına ve mentörlük potansiyeline odaklan.

Genç Kullanıcı Bilgileri:
- İlgi Alanları: {young_data.get('interests', 'Belirtilmedi')}
- Hobiler: {young_data.get('hobbies', 'Belirtilmedi')}
- Hayat Hedefleri/İhtiyaçları: {young_data.get('needs', 'Belirtilmedi')}

Yaşlı Kullanıcı Bilgileri:
- İlgi Alanları/Uzmanlıklar: {elder_data.get('interests', 'Belirtilmedi')}
- Hobiler: {elder_data.get('hobbies', 'Belirtilmedi')}
- Hayat Tecrübeleri: {elder_data.get('experiences', 'Belirtilmedi')}
- Karakter Özeti: {elder_data.get('summary', 'Belirtilmedi')}

JSON formatında ver:
{{
  "score": 0-100 (Ne kadar çok ortak payda veya mentörlük potansiyeli varsa o kadar yüksek),
  "reason": "Bu iki kişi neden eşleşti? (Örn: İkisi de ahşap oymacılığıyla ilgili)",
  "shared_themes": ["ortak tema 1", "ortak tema 2"]
}}

SADECE TÜRKÇE CEVAP VER.
Sadece JSON döndür, başka metin ekleme.
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    data = json.loads(raw)

    return ResonanceScore(
        score=data["score"],
        reason=data["reason"],
        shared_themes=data["shared_themes"],
    )


async def crystallize_lesson(conversation: list[dict]) -> Optional[str]:
    """
    Sohbetten en değerli hayat dersini bir cümleyle kristalize eder.
    """
    conv_text = "\n".join(
        [f"{m['sender']}: {m['text']}" for m in conversation]
    )

    prompt = f"""
Aşağıdaki sohbetten en değerli hayat dersini çıkar.

Sohbet:
{conv_text}

Dersi şu formatta ver:
- Tek cümle, evrensel ve güçlü
- Türkçe, sade ve derin
- Tırnak içinde

Örnek: "Yıkım, en derin inşanın başlangıcıdır."

Sadece ders cümlesini döndür.
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()


async def generate_mentor_hint(
    emotion_profile: EmotionProfile,
    elder_profile: EmotionProfile,
) -> str:
    """
    Mentöre sohbet sırasında öneride bulunur (görünmez rehberlik).
    """
    prompt = f"""
Sen bir sohbet rehberisin. Yaşlı mentöre şu anda ne söylemesi gerektiğini öner.

Gencin durumu: {emotion_profile.summary} ({emotion_profile.primary_emotion})
Mentörün geçmişi: {', '.join(elder_profile.experience_tags)}

Kısa, samimi, yönlendirici bir öneri ver (1 cümle).
"""

    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()

async def extract_needs_summary(text: str) -> str:
    """
    Genç profil kayıt metninden 'Bu kişi [Alan] alanında bilgili ve [İhtiyaç] desteğine ihtiyacı var' 
    formatında özet çıkarır.
    """
    prompt = f"""
Sen bir kariyer/psikolojik rehberlik asistanısın. Aşağıdaki genç profil yazısını analiz et.
Sadece şu formatta TEK BİR CÜMLE döndür: "Bu kişi [Alan/Konu] alanında ilgili/bilgili ve [Türü/İhtiyacı] desteğine ihtiyacı var."
Başka hiçbir giriş, selamlama veya açıklama yazma. SADECE TÜRKÇE ve TÜRK ALFABESİ kullan.

Örnekler:
- "Bu kişi Yazılım alanında bilgili ve Kariyer Rehberliği desteğine ihtiyacı var."
- "Bu kişi Üniversite Tercihi konusunda stresli ve Deneyim Paylaşımı desteğine ihtiyacı var."

Metin:
"{text}"
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=60,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"DEBUG: extract_needs_summary error: {e}")
        return "Bu gencin rehberliğe ve dinlenilmeye ihtiyacı var."

async def analyze_journal_entries(entries: list[str]) -> str:
    """
    Kullanıcının son günlük girişlerini analiz ederek bir 'gelişim odağı' özeti çıkarır.
    """
    if not entries:
        return "Henüz bir odak belirlenmedi."
        
    combined_text = "\n---\n".join(entries)
    prompt = f"""
Sen bir kişisel gelişim analiz uzmanısın. Kullanıcının aşağıdaki son günlük girişlerini incele.
Bu kişinin şu anki ruh halini ve üzerinde durduğu temel konuyu 3-5 kelimelik bir başlık/odak olarak belirle.
Sadece tırnak içinde o odağı yaz. (Örn: "Sabır ve Yeniden Başlamak")

Girişler:
{combined_text}
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=50,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip().replace('"', '')
    except Exception as e:
        print(f"DEBUG: analyze_journal_entries error: {e}")
        return "Kişisel Gelişim ve Farkındalık"

async def generate_personality_bio(context_text: str, role: str) -> str:
    """
    Kullanıcının biyografik bilgilerinden (isim, ilgi, tecrübe) 
    karakterini ve mentörlük/öğrenci potansiyelini özetleyen bir biyografi oluşturur.
    """
    prompt = f"""
Sen bir profil yazarı ve eşleştirme uzmanısın. Aşağıdaki bilgilere sahip bir "{role}" için 
sıcak, bilgece (eğer büyükse) veya umut dolu (eğer gençse) bir kişilik özeti yaz.
Maksimum 2 cümle olsun. Üçüncü şahıs ağzından yaz (Örn: "Ahmet bey, 40 yıllık mühendislik tecrübesiyle...").

Kullanıcı Bilgileri:
{context_text}

Sadece özeti döndür.
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"DEBUG: generate_personality_bio error: {e}")
        return "Paylaşmaya ve öğrenmeye açık, değerli bir topluluk üyesi."

async def analyze_detailed_profile(context_text: str, role: str) -> dict:
    """
    Kullanıcının biyografik bilgilerinden (isim, ilgi, tecrübe) 
    hem kişilik özetini hem de 'Uzmanlık Alanı' etiketini döner.
    """
    prompt = f"""
Sen bir profil uzmanı ve eşleştirme asistanısın. Aşağıdaki kullanıcı bilgilerine göre
sıcak bir kişilik özeti ve 1-2 kelimelik kısa bir uzmanlık alanı (veya odak alanı) belirle.

Rol: {role}
Bilgiler:
{context_text}

ÖNEMLİ: Cevapların tamamı TÜRKÇE olmalı ve sadece TÜRK ALFABESİ kullanılmalı. Başka dillerden (Arapça, Farsça vb.) kelime veya alfabe kesinlikle kullanma.

Şu JSON formatında cevap ver:
{{
  "summary": "Maksimum 2 cümlelik, üçüncü şahıs ağzından sıcak bir özet.",
  "expertise": "Kısa uzmanlık/odak alanı etiketi (Örn: Yazılım Geliştirme, Marangozluk, Kariyer Koçluğu)"
}}
Sadece JSON döndür.
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content.strip())
        return {
            "summary": data.get("summary", "Paylaşmaya hazır topluluk üyesi."),
            "expertise": data.get("expertise", "Genel")
        }
    except Exception as e:
        print(f"DEBUG: analyze_detailed_profile error: {e}")
        return {
            "summary": "Paylaşmaya ve öğrenmeye açık değerli bir üye.",
            "expertise": "Genel"
        }

async def calculate_expertise_alignment(youth_topic: str, elder_profile: dict) -> int:
    """
    Genç kullanıcının yardım istediği konu ile büyüğün uzmanlık/eğitim durumu arasındaki uyumu hesaplar.
    Duygusal durumdan bağımsız, sadece bilgi ve tecrübe odaklı bir yüzde (0-100) döner.
    """
    prompt = f"""
Sence aşağıdaki genç kullanıcının yardım istediği KONU ile yaşlı mentörün UZMANLIK/TECRÜBE alanı ne kadar uyumlu?
Sadece 0-100 arasında bir sayı (yüzde) döndür. Başka hiçbir metin ekleme.

Genç Kullanıcının Yardım İstediği Konu: "{youth_topic}"

Yaşlı Mentörün Profili:
- Uzmanlık Seviyesi: {elder_profile.get('expertise_level', 'Belirtilmedi')}
- İlgi Alanları: {elder_profile.get('interests', 'Belirtilmedi')}
- Hayat Tecrübeleri: {elder_profile.get('life_experiences', 'Belirtilmedi')}
- Kişilik Özeti: {elder_profile.get('personality_summary', 'Belirtilmedi')}

Önemli: Eğer mentörün tecrübesi konuyla doğrudan ilgiliyse %90+, dolaylı ilgiliyse %60-80, ilgisizse %20-40 civarı puan ver.
Sadece bir tam sayı döndür.
"""
    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}],
        )
        score_text = response.choices[0].message.content.strip()
        # Extract only digits in case AI adds something
        import re
        match = re.search(r'\d+', score_text)
        if match:
            return min(100, max(0, int(match.group())))
        return 50
    except Exception as e:
        print(f"DEBUG: calculate_expertise_alignment error: {e}")
        return 50