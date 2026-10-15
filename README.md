# 🎸 Gitar Akor Pro (Guitar Chord & Fretboard Visualizer)

Modern, interaktif ve yapay zeka destekli gitar akor & şarkı çalma asistanı. 

Herhangi bir şarkının sözleri üzerindeki akorları canlı bir **gitar sapı (fretboard)** üzerinde parmak pozisyonları, bare basışları ve gerçek akustik ses tınısı ile senkronize olarak gösterir. Şarkı internette veya hiçbir yerde olmasa bile, yapay zeka armoni analiz motoru şarkının akorlarını anında üretir.

---

## ✨ Özellikler

### 1. 🎸 İnteraktif SVG Gitar Sapı (Fretboard)
- **6 Tel & 14 Perde**: Standart E-A-D-G-B-e akort, sedef perde işaretleri (3, 5, 7, 9, 12 çift nokta).
- **Parmak & Bare Gösterimi**: Hangi parmağın hangi tele basacağını gösteren numaralar (1-4) ve bare akor şeritleri.
- **Boş & Kapalı Teller**: Boş tınlayacak teller (`O`) ve çalınmayacak teller (`✕`).
- **Görünüm Modları**: Parmak Numaraları veya Nota İsimleri (C, D, E...) arasında tek tıkla geçiş.
- **Solak Gitarist Desteği**: Solaklar için ayna görüntüsü modu.
- **Çoklu Pozisyon Seçimi**: Aynı akorun farklı pozisyonları (örn. Açık Am vs 5. perde Bare Am).

### 2. 🔊 Web Audio API Gerçekçi Akustik Tel Sentezi (Karplus-Strong)
- Sıfır dış bağımlılık veya ses dosyası yükleme gecikmesi.
- Karplus-Strong fiziksel modelleme algoritması ile gerçek akustik tel titreşimi ve rezonansı.
- **Strum (Akor Tarama)**: Akor basıldığında tellerin 28ms gecikmeyle aşağı doğru doğal taranması.
- **Tek Tel Vuruşu**: Gitardaki herhangi bir tele veya perdeye tıklandığında o notanın anında çalınması.

### 3. 🎵 ChordPro Oynatıcı & Senkronize Sözler
- Şarkı sözleri üzerindeki akor rozetleri.
- Akora tıklandığında gitar sapı anında o akora geçer ve akoru tınlatır.
- **Transpoze Motoru**: Tek tıkla şarkıyı `+1` / `-1` yarım ses yukarı/aşağı taşıma.
- **Otomatik Kaydırma (Auto-Scroll)**: Ayarlanabilir hız ile şarkı çalarken sayfanın eller serbest aşağı kayması.
- **Kapo (Capo) Desteği**: Kapo perde tavsiyesi ve ton eşlemesi.

### 4. 🧠 Yapay Zeka (AI) Akor Çıkarıcı & Akıllı Arama
- **Yeni / Bilinmeyen Şarkılar**: Şarkı internette hiç bulunmasa bile yapay zeka müzik teorisi ve armoni analiziyle tonu, kıta ve nakarat akor döngüsünü otomatik üretir.
- **İki Satırlı Tab & Metin Yapıştırma**: Ultimate Guitar veya AkorMerkezi'nden kopyalanan iki satırlı akor-söz metinlerini otomatik algılayıp ChordPro formatına dönüştürür.
- **Kalıcı Hafıza**: Eklenen özel şarkılar LocalStorage'da saklanır.

### 5. ⏱️ Dahili Metronom
- 40 - 220 BPM arası tempo ayarı.
- 4/4 zamanlı görsel vuruş animasyonu ve akustik metronom klik sesi.

---

## 🛠️ Teknoloji Yığını
- **Frontend**: React 19, TypeScript, Vite
- **Stil**: Tailwind CSS v4, Lucide React Icons
- **Ses Motoru**: Web Audio API (Native Karplus-Strong physical modeling)
- **Doğrulama**: Iris Visual Testing

---

## 🚀 Hızlı Başlangıç

```bash
# Projeyi klonlayın
git clone https://github.com/brkNx/guitar-chord-app.git

# Dizinine girin
cd guitar-chord-app

# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine gidin.

---

## 📦 Üretim Derlemesi

```bash
npm run build
npm run preview
```
