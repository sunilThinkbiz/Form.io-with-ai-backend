🧠 AI Form Generator – Backend (Node.js + Express + Gemini)
This backend service powers the AI-driven form builder. It takes natural language prompts, generates Form.io-compatible schemas using Google Gemini, and merges them intelligently with existing form structures.

📦 Tech Stack
Backend: Node.js, Express

AI Integration: Google Gemini API (via Generative Language API)

HTTP Client: Axios with custom HTTPS agent

Environment Variables: dotenv for API key security


1. Clone the Repository

git remote add origin https://github.com/sunilThinkbiz/Form.io-with-ai-backend.git
cd Form.io-with-ai/backend
2. Install Dependencies

npm install
3. Create .env File
env

GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5000
4. Start the Server

node index.js