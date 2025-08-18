const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const formRoutes = require('./routes/formRoutes');
const geminiRoutes = require('./routes/gemini');
const generateTextRoute  = require('./routes/generateText')
const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use('/api/forms', formRoutes); // ➕ Add route
app.use('/api/gemini-generate', geminiRoutes);
app.use('/api',generateTextRoute)

// MongoDB Connect
mongoose.connect('mongodb://localhost:27017/mydb')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
