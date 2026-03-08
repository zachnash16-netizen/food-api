const OpenAI = require("openai");

module.exports = async function handler(req, res) {

  // Enable CORS
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
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert nutrition AI. Analyze the food image carefully. Identify each food item, estimate portion size, and estimate macros using realistic nutrition values. Return ONLY valid JSON in this format: { foods: [{ name: string, portion: string, calories: number, protein: number, carbs: number, fat: number }] }"
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this food image and estimate portion sizes and macros for each food item." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    const content = response?.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

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
