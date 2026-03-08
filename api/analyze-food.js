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
            "You are a nutrition assistant. Identify all foods in the image, estimate portion sizes, and estimate macros for each food. Return ONLY valid JSON in this structure: { foods: [{ name: string, calories: number, protein: number, carbs: number, fat: number }] }"
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

    const foods = parsed.foods ?? [];

    const items = foods.map(food => ({
      name: food.name ?? "Food item",
      calories: Number(food.calories ?? 0),
      protein: Number(food.protein ?? 0),
      carbs: Number(food.carbs ?? 0),
      fat: Number(food.fat ?? 0)
    }));

    const totals = items.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return res.status(200).json({
      items,
      totals
    });

  } catch (error) {

    console.error("OpenAI error:", error);

    return res.status(500).json({
      error: "Failed to analyze food image",
      details: error.message
    });

  }

};
