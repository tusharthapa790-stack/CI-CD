import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI with telemetry headers as per rules
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. API: Custom Django blueprint generator based on user prompt
app.post("/api/gemini/generate-blueprint", async (req, res) => {
  try {
    const { idea, databaseType } = req.body;
    if (!idea) {
      return res.status(400).json({ error: "Idea is required" });
    }

    const systemInstruction = `You are a Python Django Architect. You will help build a modular, beautiful, and fully correct Django project blueprint based on a user's project idea.
For the specified database (${databaseType || "sqlite"}), structure your models appropriately.
Return the output strictly matching the provided JSON schema. Ensure your generated code is fully syntactically correct Python, complete, and contains docstrings and proper comments. Do not truncate the code.`;

    const prompt = `Create a Django project blueprint for this idea: "${idea}". 
Please generate a project structure with these key files:
1. 'models.py' (defining the models with proper Fields and relations like ForeignKey, ManyToManyField, or OneToOneField)
2. 'views.py' (containing at least 3 views - e.g., ListView, DetailView, CreateView or function-based views with clear logic)
3. 'urls.py' (with URL routing for the views)
4. 'admin.py' (registering the models with list_display and search_fields)
5. 'serializers.py' or 'forms.py' (appropriate forms/serializers for input handling)

Make the models realistic, utilizing rich Django fields (e.g. DateTimeField, DecimalField, SlugField, EmailField, etc.).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["projectName", "description", "files", "explanations"],
          properties: {
            projectName: {
              type: Type.STRING,
              description: "The name of the Django app or project in snake_case (e.g. 'bookstore_app')",
            },
            description: {
              type: Type.STRING,
              description: "Brief summary of the architecture and database relations designed.",
            },
            files: {
              type: Type.ARRAY,
              description: "Array of Django files to generate.",
              items: {
                type: Type.OBJECT,
                required: ["path", "content", "filename"],
                properties: {
                  filename: {
                    type: Type.STRING,
                    description: "The visual name of the file (e.g. 'models.py')",
                  },
                  path: {
                    type: Type.STRING,
                    description: "Relative file path (e.g. 'store/models.py')",
                  },
                  content: {
                    type: Type.STRING,
                    description: "Full python file content with high quality, readable, styled, and complete code.",
                  },
                },
              },
            },
            explanations: {
              type: Type.STRING,
              description: "Step-by-step learning guide: how to initialize, run makemigrations, migrate, create a superuser, and runserver.",
            },
          },
        },
      },
    });

    const responseText = response.text || "{}";
    const data = JSON.parse(responseText.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Error generating Django blueprint:", error);
    res.status(500).json({ error: error.message || "Failed to generate Django blueprint" });
  }
});

// 2. API: Django AI Tutor Chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const systemInstruction = `You are "DjangoMaster AI", an elite, supportive, and friendly Python Django Tutor and Senior Architect. 
Your goal is to explain Django concepts beautifully and simply to developers of all levels.
Helpful guidelines:
- Relate concepts back to Django's Model-View-Template (MVT) architecture.
- Keep explanations elegant, scannable, using bold key terms and clean code blocks.
- Provide practical explanations of how Python Django does routing, views, querysets, migrations, and template rendering.
- Maintain a highly professional, encouraging, and clear tone.`;

    // Format history for generating content
    // We will extract content as text and combine appropriately
    const formattedPrompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n") + "\nAssistant:";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedPrompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error in AI Tutor chat:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Tutor" });
  }
});

// Configure Vite or production serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting dev server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist directory in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer();
