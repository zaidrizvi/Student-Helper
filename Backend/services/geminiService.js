const axios = require("axios");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;

    if (!this.apiKey) throw new Error("GEMINI_API_KEY not set in environment");

    this.axiosInstance = axios.create({
      headers: { "Content-Type": "application/json" },
      timeout: 60000 // 60s timeout
    });

    // Your custom model list
    this.endpoints = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    this.RETRY_STATUS = [503, 429, 500];
  }

  getModelURL(modelName) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
  }

  /**
   * Helper to strip Markdown and find the JSON payload
   */
  cleanAndParseJSON(text) {
    try {
      let cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // try array
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) return JSON.parse(arrayMatch[0]);

        // try object
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objectMatch) return JSON.parse(objectMatch[0]);

        throw new Error("No JSON structure found");
      }
    } catch (err) {
      console.error("JSON Parse Failed:", err.message);
      throw err;
    }
  }

  async callGemini(prompt, retryCount = 0) {
    const modelName = this.endpoints[retryCount % this.endpoints.length];
    const url = this.getModelURL(modelName);

    try {
      const response = await this.axiosInstance.post(url, {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("No response text received from Gemini");

      return text;
    } catch (err) {
      const status = err.response?.status;
      const isRetryable = this.RETRY_STATUS.includes(status) || !status;

      if (isRetryable && retryCount < this.endpoints.length - 1) {
        const delay = Math.min(1000 * 2 ** retryCount, 5000);
        await new Promise(res => setTimeout(res, delay));
        return this.callGemini(prompt, retryCount + 1);
      }

      throw err;
    }
  }

  getModeInstructions(mode) {
    const instructions = {
      short: `Provide a  executive summary in 2-3 paragraph. Focus ONLY on the  most important takeaways. Use "##" for the main title.`,
      normal: `Act as a supportive tutor. Explain the content in clear sections. Use analogies sometimes when necessary. Always use "##" for section headers.`,
      detailed: `Act as a professor. Provide a comprehensive breakdown.
1. Start with a high-level overview.
2. Define key terminology.
3. Explain complex mechanisms step-by-step.
Use "##" for major sections and "###" for subsections.`,
      ultra: `Act as a study guide creator. Structure the response for exam preparation. Use these exact headers:
## Core Concepts
## Key Definitions
## Process Flow
## Exam Tips`
    };

    return instructions[mode] || instructions.normal;
  }

  async summarize(text, prompt = "", mode = "normal") {
    const modeInstr = this.getModeInstructions(mode);

    const systemPrompt = `
You are an expert educational AI. Your goal is to make complex notes easy to understand.

STRICT FORMATTING RULES (CRITICAL):
1. **Headings**: You MUST use Markdown headers (#, ##, ###) for ALL titles and sections.
2. **Structure**: Use "##" for main topics and "###" for sub-topics.
3. **Spacing**: You MUST add TWO blank lines before every Heading (#). Never put a heading directly under text.
4. **Bold**: Use **bold** for key terms. Ensure there is a space before the start of the bold stars.
5. **No Intro**: Start directly with the content.
`;

    const fullPrompt = `
${systemPrompt}
User Instruction: "${prompt.trim() || "Summarize this."}"
Explanation Mode: ${mode.toUpperCase()}
${modeInstr}

SOURCE NOTES:
${text}
`;

    return await this.callGemini(fullPrompt);
  }

  async generateQuiz(text, numQuestions = 5) {
    // --- BALANCED PROMPT (Not too hard, not too easy) ---
    const prompt = `
You are a helpful tutor creating a practice quiz.
Create a **Balanced** multiple-choice quiz based on the notes below.

**Question Design Rules:**
1. **Difficulty Mix:** Create a mix of Easy (Definitions), Medium (Concepts), and Hard (Application) questions.
2. **Clarity:** Ensure questions are easy to read and directly related to the text.
3. **Relevance:** Focus on the most important takeaways.
4. **Fairness:** Options should be clear. Avoid confusing trick questions.

**Technical Constraints:**
1. Generate exactly ${numQuestions} questions.
2. The "answer" field must be an EXACT STRING COPY of one of the options.
3. Return ONLY RAW JSON ARRAY. No markdown formatting.

JSON Structure:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "Option B",
  "topic": "Concept Name"
}

SOURCE NOTES:
${text}
`;

    const response = await this.callGemini(prompt);

    try {
      let quizData = this.cleanAndParseJSON(response);
      if (!Array.isArray(quizData)) throw new Error("Result is not an array");
      
      // Post-Processing: Validate answers exist in options
      quizData = quizData.map(q => {
        if (!q.options.includes(q.answer)) {
            // Fallback logic
            const match = q.options.find(opt => opt.includes(q.answer) || q.answer.includes(opt));
            q.answer = match || q.options[0]; 
        }
        return q;
      });

      return quizData.slice(0, numQuestions);
    } catch (err) {
      console.error("Quiz Generation Failed:", err.message);
      throw new Error("Failed to generate valid quiz data. Please try again.");
    }
  }

  async explainWeakTopics(text, weakTopics) {
    if (!weakTopics || weakTopics.length === 0) return {};

    const topTopics = weakTopics.slice(0, 3);

    const prompt = `
The student struggled with these topics: ${JSON.stringify(topTopics)}.

Your Goal: Explain these topics clearly so they never get them wrong again.

STRICT FORMATTING:
1. Use **Bold** for key terms.
2. Use Bullet points (-) for lists.
3. Always use a **Real World Analogy**.
4. Keep spacing open and readable.

Return ONLY a JSON object. Keys = Topic Name. Values = Markdown string.

SOURCE NOTES:
${text}
`;

    const response = await this.callGemini(prompt);

    try {
      return this.cleanAndParseJSON(response);
    } catch (err) {
      return {};
    }
  }
}

module.exports = new GeminiService();