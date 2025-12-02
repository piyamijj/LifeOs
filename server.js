const express = require("express");
require("dotenv").config();

const app = express();

// Resim verisi büyük olabileceği için limitleri artırdık
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/ask", async (req, res) => {
  try {
    const { history, question, context, image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ answer: "HATA: API Anahtarı eksik." });

    // Matematik ve Görsel için en iyi model
    const modelName = "gemini-pro-latest"; 

    const systemInstruction = `
    Senin adın: "LifeOS". Kullanıcının (Piyami) sadık dostu, zeki kardeşi ve asistanısın.
    
    KURALLAR:
    1. USLUP: Samimi, sıcak, "Dostum", "Kardeşim" diye hitap et. Asla "Emret" deme.
    2. GÖREV: Eğer bir matematik sorusu veya resim gelirse, bir öğretmen gibi adım adım çöz. Sadece cevabı verme, mantığını anlat.
    3. DİL: Türkçe cevap ver (Kullanıcı Farsça isterse Farsça).
    4. TERCÜME: Farsça kelimelerin yanına (okunuşunu) yaz.
    `;

    // Mesaj içeriğini hazırla
    let userParts = [{ text: `(Sistem Bilgisi: ${context}) \n\n${question}` }];
    
    // Eğer resim varsa ekle
    if (image) {
        // Base64 başlığını temizle (data:image/jpeg;base64,...)
        const base64Data = image.split(',')[1];
        userParts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
            }
        });
    }

    let contentsArray = [{ role: "user", parts: [{ text: systemInstruction }] }];

    // Geçmiş sohbeti ekle
    if (history && history.length > 0) {
        history.forEach(msg => {
            contentsArray.push({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });
    }

    contentsArray.push({ role: "user", parts: userParts });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: contentsArray })
    });

    const data = await response.json();

    if (data.error) return res.json({ answer: "Google Hatası: " + data.error.message });

    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap yok.";
    res.json({ answer });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    res.status(500).json({ answer: "Sunucu hatası: " + error.message });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
}
