import OpenAI from "openai";

export default async function handler(req, res) {
  // Only allow POST
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
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate macros for this food image. Return JSON." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    res.status(200).json(
      JSON.parse(response.choices[0].message.content)
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
