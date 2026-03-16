import express from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// API Routes
app.post("/api/parse-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const data = await pdf(req.file.buffer);
    res.json({ text: data.text, numPages: data.numpages });
  } catch (error) {
    console.error("PDF parsing error:", error);
    res.status(500).json({ error: "Failed to parse PDF" });
  }
});

app.post("/api/blueprints", async (req, res) => {
  const { id, title, content } = req.body;
  
  if (supabase) {
    const { error } = await supabase
      .from('blueprints')
      .insert([{ id, title, content: JSON.stringify(content) }]);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } else {
    // Fallback for local dev without Supabase
    console.log("Supabase not configured. Blueprint received:", title);
    res.json({ success: true, warning: "Supabase not configured. Data not persisted." });
  }
});

app.get("/api/blueprints/:id", async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('blueprints')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) return res.status(404).json({ error: "Blueprint not found" });
    res.json({ ...data, content: JSON.parse(data.content) });
  } else {
    res.status(501).json({ error: "Supabase not configured for retrieval" });
  }
});

// Export for Vercel
export default app;
