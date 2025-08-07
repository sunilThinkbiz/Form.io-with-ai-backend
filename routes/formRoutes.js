// routes/formRoutes.js
const express = require('express');
const router = express.Router();
const Form = require('../models/formModel');

// Save form
router.post('/save', async (req, res) => {
  try {
    const { title, display, components } = req.body;

    const form = await Form({ title, display, components });
    const saved = await form.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all forms
router.get('/all', async (req, res) => {
  try {
    const forms = await Form.find();
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
