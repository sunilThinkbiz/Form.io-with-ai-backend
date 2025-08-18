const express = require("express");
const generatePrompt = require("../utils/promptTemplate");
const axiosInstance = require("../utils/AxiosHttp");

const router = express.Router();

const GEMINI_URL = process.env.GEMINI_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

router.post("/generate-text", async (req, res) => {
  try {
    const { prompt, component, mode } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Missing prompt" });
    }

    const title = component?.label || component?.key || "Announcement";

    const generationPrompt = generatePrompt(
      prompt,
      {},
      component,
      title,
      mode || "autogenerate"
    );

    const gRes = await axiosInstance.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: generationPrompt }] }],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }
    );

    const rawText =
      gRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const text = rawText.replace(/```/g, "").trim();

    res.json({ success: true, text });
  } catch (error) {
    console.error(
      "generate-text error",
      error?.response?.data || error.message
    );
    res.status(500).json({ success: false, error: "Generation error" });
  }
});

module.exports = router;
