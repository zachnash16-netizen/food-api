const OpenAI = require("openai");

module.exports = async function handler(req, res) {

  // Allow requests from your app
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
      apiKey: process.env.OPENAI_API_KEY
    });

    const { image } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition assistant. Identify foods in the image and estimate portion sizes. Then calculate total macros. Return ONLY valid JSON with this structure: { foods: [{ name: string, portion: string }], calories: number, protein: number, carbs: number, fat: number }"
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

    const content = response?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    console.log("AI RAW RESPONSE:", parsed);

    const result = {
      calories: Number(parsed.calories ?? parsed.total_calories ?? 0),
      protein: Number(parsed.protein ?? parsed.protein_g ?? 0),
      carbs: Number(parsed.carbs ?? parsed.carbohydrates ?? 0),
      fat: Number(parsed.fat ?? parsed.fat_g ?? 0),
      foods: parsed.foods ?? []
    };

    return res.status(200).json({
      items: [
        {
          name: "Detected food",
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat
        }
      ],
      totals: {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      }
    });

  } catch (error) {

    console.error("OpenAI error:", error);

    return res.status(500).json({
      error: "Failed to analyze food image",
      details: error.message
    });

  }

};
