const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// 1. Resim Limiti (50MB - Bağlantı Hatasını Önler)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 2. Güvenlik İzni (CORS Hatasını Çözer)
app.use(cors());

app.use(express.static(__dirname));

// SENİN İSTEDİĞİN MODEL ADI (DOKUNMA)
const MODEL_NAME = "gemini-pro-latest"; 

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/ask", async (req, res) => {
  try {
    const { history, question, image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ answer: "API Key Vercel ayarlarında eksik dostum." });

    const SYSTEM_INSTRUCTION = `
    Sen Piyami LifeOS'sun. Kullanıcın Piyami Bey.
    Görsel gelirse içindeki problemi çöz.
    Samimi ol. Farsça konuşursan okunuşunu parantezde yaz.
    `;

    let contentsArray = [];

    // Geçmiş sohbeti ekle
    if (history && history.length > 0) {
        history.forEach(msg => {
            if(msg.text) {
                contentsArray.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            }
        });
    }

    // Yeni mesaj + Resim
    const newParts = [{ text: question || "Bunu analiz et." }];
    
    if (image) {
        // Base64 başlığını temizle
        const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
        newParts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
            }
        });
    }

    contentsArray.push({ role: "user", parts: newParts });

    // Google API Çağrısı
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          contents: contentsArray,
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }
      })
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Gemini Hatası:", data.error);
        return res.json({ answer: "Google Hatası: " + data.error.message });
    }

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap yok.";
    res.json({ answer });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    res.status(500).json({ answer: "Sunucu hatası: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LifeOS (Node 20 - ${MODEL_NAME}) ${PORT} portunda!`));
