require("dotenv").config();
const express = require("express");
const router = express.Router();
const generatePrompt = require("../utils/promptTemplate");
const axiosInstance = require("../utils/AxiosHttp");

// ✅ Merge logic: update only what's needed, don't duplicate
function mergeSchemas(existingComponents, generatedComponents) {
  const existingMap = new Map();
  existingComponents.forEach((comp) => {
    existingMap.set(comp.key, comp);
  });

  const final = [];

  for (const newComp of generatedComponents) {
    const existing = existingMap.get(newComp.key);
    if (existing) {
      final.push({ ...existing, ...newComp }); // merge while keeping new order
      // existingMap.delete(newComp.key);
    } else {
      final.push(newComp);
    }
  }

  return final;
}

// ✅ AI-based form update route
router.post("/save-ai-form", async (req, res) => {
  const { prompt, existingSchema } = req.body;

  if (!prompt || !existingSchema || !Array.isArray(existingSchema.components)) {
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid prompt or schema" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_URL = process.env.GEMINI_URL;
  if (!GEMINI_API_KEY || !GEMINI_URL) {
    return res
      .status(500)
      .json({ success: false, error: "Gemini config missing" });
  }
  const generationPrompt = generatePrompt(prompt, existingSchema);


  try {
    const geminiResponse = await axiosInstance.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: generationPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }
    );

    const rawText =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res
        .status(500)
        .json({ success: false, error: "No response from Gemini" });
    }

    // 🧼 Clean raw Gemini JSON output
    let cleanJSON = rawText.replace(/```json|```/g, "").trim();
    const jsonStart = cleanJSON.indexOf("{");
    const jsonEnd = cleanJSON.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanJSON = cleanJSON.substring(jsonStart, jsonEnd + 1);
    }

    const generatedSchema = JSON.parse(cleanJSON);

    // 🧠 Merge new updates into the existing schema
    const updatedComponents = mergeSchemas(
      existingSchema.components,
      generatedSchema.components || []
    );

    const finalSchema = {
      ...existingSchema,
      components: updatedComponents,
    };

    res.json({ success: true, formSchema: finalSchema });
  } catch (error) {
    console.error("❌ Gemini error:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Failed to generate form schema" });
  }
});

module.exports = router;
