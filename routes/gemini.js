require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");

// ✅ Axios instance setup
const axiosInstance = axios.create({
      headers: {
      "Content-Type": "application/json",
    },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
  }),
});

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
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: "Missing API key" });
  }

 const generationPrompt = `
You are a professional Form.io form schema generator.

Input:
1. A user's change request (e.g., "rename 'test field' to 'first name'")
2. The current JSON schema in Form.io format
- If extra fields are provided in the prompt or previously unmatched fields are confirmed, place them exactly where the user requested in the new schema.
- Do NOT append them at the end unless the user explicitly says "add at the end".
If user says "show fields when checkbox is checked", add conditional logic:
"conditional": { "show": true, "when": "<checkbox-key>", "eq": "true" }

Your task:
- Modify or add fields based on the user request and any additional instructions.
- If extra fields are provided in the prompt (e.g., unmatched fields), place them in the correct logical order based on user instructions.
- Modify only what's needed based on the user request.
- NEVER create a new component if the change only requires modifying an existing one.
- If a field with a given label exists, and the request is to change it, update that exact component's "label" property.
- NEVER duplicate or add fields with the same "key".
- Return ONLY a single, valid JSON (no markdown, no explanation).

User Prompt:
"${prompt}"

Current Form Schema:
${JSON.stringify(existingSchema)}

Rules:
- Modify existing fields if prompt mentions changing labels, placeholders, etc.
- Don't duplicate components.
- Keep keys the same unless the prompt says to change them.
- Ensure valid Form.io structure.

Only return JSON. Do not explain anything.
Additional Capabilities:
- If the user requests field reordering (e.g., "move email to top"), reorder the components accordingly.
- If the prompt suggests layout changes, use appropriate Form.io containers like:
  - "columns" for side-by-side layout
  - "panel" or "fieldset" for grouping fields
- Preserve the rest of the form structure unless a change is explicitly requested.
`;


  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiResponse = await axiosInstance.post(GEMINI_API_URL, {
      contents: [{ parts: [{ text: generationPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const rawText = geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ success: false, error: "No response from Gemini" });
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
    return res.status(500).json({ success: false, error: "Failed to generate form schema" });
  }
});

module.exports = router;
