# backend/services/nlp_engine.py
"""
NLP Motoru — Hayat Köprüsü
Duygu analizi, eşleştirme skoru ve kriz tespiti
"""

from groq import Groq
from dataclasses import dataclass
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
    age: int
    city: str
    life_experiences: list[str]
    hobbies: list[str]
    personality_summary: str


client = Groq(api_key=os.environ.get("GROQ_API_KEY", "dummy_fallback_key"))
GROQ_MODEL = "llama-3.3-70b-versatile"  # Ücretsiz, güçlü model


async def extract_elder_profile(text: str) -> ElderProfileExtract:
    """Yaşlının sesli anlatımını ayrıştırıp yapılandırılmış JSON döner."""
    prompt = f"""
Sen bilgileri çıkaran bir asistansın. Aşağıdaki mentörün (yaşlı) konuşmasından şu bilgileri JSON olarak çıkar. Eğer yaş veya isim net değilse tahminde bulun veya boş/0 bırak.
{{
  "name": "ismi",
  "age": yaş(sayı),
  "city": "şehir",
  "life_experiences": ["tecrübe1", "tecrübe2"],
  "hobbies": ["hobi1", "hobi2"],
  "personality_summary": "1-2 cümlelik kişilik özeti"
}}

Metin: "{text}"

Sadece JSON döndür.
"""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content.strip())
    return ElderProfileExtract(
        name=data.get("name", "Bilinmiyor"),
        age=int(data.get("age", 0)) if data.get("age") else 0,
        city=data.get("city", "Bilinmiyor"),
        life_experiences=data.get("life_experiences", []),
        hobbies=data.get("hobbies", []),
        personality_summary=data.get("personality_summary", ""),
    )

async def analyze_emotion(text: str, user_role: str) -> EmotionProfile:
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

Sadece JSON döndür, başka metin ekleme.
"""

    response = client.chat.completions.create(
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

    response = client.chat.completions.create(
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

    response = client.chat.completions.create(
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

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()