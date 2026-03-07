const OpenAI = require("openai");

module.exports = async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!req.body || !req.body.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { image } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition assistant. Identify foods and return ONLY valid JSON with calories, protein, carbs, and fat."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food image and estimate macros." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

   const parsed = JSON.parse(response.choices[0].message.content);

console.log("AI RAW RESPONSE:", parsed);

return res.status(200).json(parsed);
    );

  } catch (error) {
    console.error("OpenAI error:", error);
    return res.status(500).json({ error: "Failed to analyze food image" });
  }
}
