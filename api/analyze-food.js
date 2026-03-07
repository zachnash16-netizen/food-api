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
            "You are a nutrition assistant. Analyze the food image and return ONLY valid JSON with numeric fields: calories, protein, carbs, fat."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate macros for this food image." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    console.log("AI RAW RESPONSE:", parsed);

    const result = {
      calories: parsed.calories ?? parsed.total_calories ?? 0,
      protein: parsed.protein ?? parsed.protein_g ?? 0,
      carbs: parsed.carbs ?? parsed.carbohydrates ?? 0,
      fat: parsed.fat ?? parsed.fat_g ?? 0
    };

    return res.status(200).json({
      data: {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      },
      macros: {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat
      },
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat
    });

  } catch (error) {

    console.error("OpenAI error:", error);

    return res.status(500).json({
      error: "Failed to analyze food image",
      details: error.message
    });

  }

};
