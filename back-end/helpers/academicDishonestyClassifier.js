const axios = require("axios");

const classifyAcademicDishonesty = async (content) => {
  try {
    console.log("[DISHONESTY] calling OpenRouter...");
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `You are an academic integrity monitor
for a student learning platform. Analyze this
post and determine if it contains academic
dishonesty.

Look for:
- Sharing exam or test answers
- Asking others to complete assignments
- Posting plagiarized academic content
- Sharing assessment questions or answers
- Contract cheating (paying for assignments)

Do NOT flag:
- Normal study help or concept explanations
- Sharing learning resources or articles
- Career or personal posts
- General community discussions

Post content: "${content}"

Respond in JSON only with no extra text:
{
  "isDishonest": boolean,
  "confidence": "low|medium|high",
  "reason": "brief explanation",
  "category": "exam_sharing|plagiarism|assignment_cheating|none"
}

Return ONLY valid JSON, no other text,
no markdown, no backticks.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://smaart-institute.com",
          "X-Title": "SMAART Institute",
          "Content-Type": "application/json",
        },
      },
    );

    const text = response.data.choices[0].message.content;
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    console.log("[DISHONESTY] result:", result);
    return result;
  } catch (error) {
    console.error(
      "[DISHONESTY] full error:",
      error.response?.data || error.message,
    );
    return {
      isDishonest: false,
      confidence: "low",
      reason: "classifier unavailable",
      category: "none",
    };
  }
};

module.exports = { classifyAcademicDishonesty };
