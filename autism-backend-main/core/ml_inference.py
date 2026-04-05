import os
import joblib
import numpy as np
import librosa
from django.conf import settings

# إعدادات معالجة الصوت (مطابقة لما تم تدريب المودل عليه)
N_MFCC = 13
FRAME_SEC = 0.025
HOP_SEC = 0.010

# مسارات المودلات (تأكدي أن المجلد ml_models موجود داخل مجلد core وفيه الملفات)
MALE_MODEL = os.path.join(settings.BASE_DIR, "core",  "male_final_best_bundle.pkl")
FEMALE_MODEL = os.path.join(settings.BASE_DIR, "core", "female_final_best_bundle.pkl")

def extract_features_v2(y, sr):
    """استخراج الخصائص الصوتية من الملف"""
    frame_length = max(256, int(FRAME_SEC * sr))
    hop_length = max(128, int(HOP_SEC * sr))

    # استخراج MFCC والـ Deltas
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC, n_fft=frame_length, hop_length=hop_length)
    d1 = librosa.feature.delta(mfcc, order=1)
    d2 = librosa.feature.delta(mfcc, order=2)

    feats = []
    for arr in (mfcc.T, d1.T, d2.T):
        feats.append(arr.mean(axis=0))
        feats.append(arr.std(axis=0))

    feats = np.concatenate(feats)

    # ميزات إضافية (ZCR, RMS, Centroid, Rolloff)
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=frame_length, hop_length=hop_length)[0]
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=frame_length, hop_length=hop_length)[0]
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=frame_length, hop_length=hop_length)[0]

    extra = np.array([
        zcr.mean(), zcr.std(),
        rms.mean(), rms.std(),
        centroid.mean(), centroid.std(),
        rolloff.mean(), rolloff.std()
    ])

    x = np.concatenate([feats, extra])
    return np.nan_to_num(x)

def load_bundle(gender):
    """تحميل موديل الذكاء الاصطناعي بناءً على الجنس"""
    if gender.lower() == "male":
        path = MALE_MODEL
    else:
        path = FEMALE_MODEL

    bundle = joblib.load(path)
    return bundle

def predict_asd(file_path, gender):
    """تحليل الملف الصوتي وإعطاء النتيجة النهائية"""
    # تحميل ملف الصوت
    y, sr = librosa.load(file_path, sr=None)

    # استخراج الخصائص وتحويلها لشكل يفهمه الموديل
    x = extract_features_v2(y, sr)
    x = x.reshape(1, -1)

    # تحميل الموديل والـ Threshold
    bundle = load_bundle(gender)
    model = bundle["model"]
    threshold = bundle["threshold"]

    # حساب الاحتمالات
    prob_asd = float(model.predict_proba(x)[0][1])
    
    # تحديد النتيجة بناءً على الـ Threshold
    if prob_asd >= threshold:
        prediction = "ASD"
    else:
        prediction = "TD"

    # تم تعديل المفاتيح هنا (label و prob) لتطابق ملف admin.py و views.py
    return {
        "gender": gender,
        "label": prediction,        # النتيجة (ASD أو TD)
        "prob": round(prob_asd, 4), # نسبة الاحتمالية
        "threshold": threshold
    }