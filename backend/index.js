import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* -----------------------------
   STATE
-------------------------------- */
let userState = {
  topic: null,   // life insurance, term insurance, etc.
  age: null,
  stage: "start" // start → profile → recommend → explain
};

/* -----------------------------
   HELPERS
-------------------------------- */
function detectTopic(msg) {
  if (msg.includes("term")) return "term insurance";
  if (msg.includes("life")) return "life insurance";
  if (msg.includes("health")) return "health insurance";
  return null;
}

function extractAge(msg) {
  const match = msg.match(/\b(1[8-9]|[2-5][0-9]|6[0-5])\b/);
  return match ? match[0] : null;
}

function wantsRecommendation(msg) {
  return (
    msg.includes("best") ||
    msg.includes("buy") ||
    msg.includes("suggest") ||
    msg.includes("recommend") ||
    msg.includes("which plan")
  );
}

/* -----------------------------
   MAIN CHAT
-------------------------------- */
app.post("/api/chat", async (req, res) => {
  const msg = req.body.message.toLowerCase().trim();

  /* 🔁 RESET */
  if (msg.includes("restart") || msg.includes("reset")) {
    userState = { topic: null, age: null, stage: "start" };
    return res.json({
      reply: "No worries 😊 Let’s start again. Which insurance would you like to know about?"
    });
  }

  /* 🟢 STAGE 1: TOPIC */
  if (userState.stage === "start") {
    const topic = detectTopic(msg);

    if (topic) {
      userState.topic = topic;
      userState.stage = "profile";

      return res.json({
        reply: `Got it 👍 You’re asking about ${topic}.  
To recommend the right plan, can you tell me your age?`
      });
    }

    return aiReply(
      "You are a friendly insurance assistant. Ask the user which insurance they want help with.",
      msg,
      res
    );
  }

  /* 🟢 STAGE 2: PROFILE (AGE) */
  if (userState.stage === "profile") {
    const age = extractAge(msg);

    if (age) {
      userState.age = age;

      // If user already wants recommendation → jump directly
      if (wantsRecommendation(msg)) {
        userState.stage = "recommend";
      } else {
        userState.stage = "recommend";
      }

      return res.json({
        reply: `Thanks 👍 At age ${age}, I can suggest the best ${userState.topic} plan for you.  
Would you like my recommendation?`
      });
    }

    return res.json({
      reply: "Just tell me your age 😊 (for example: 28)"
    });
  }

  /* 🟢 STAGE 3: RECOMMENDATION (CRITICAL FIX) */
  if (userState.stage === "recommend") {

    // If user asks which/best/buy OR says yes
    if (wantsRecommendation(msg) || msg.includes("yes") || msg.includes("plan")) {

      let reply = "";

      if (userState.topic === "life insurance") {
        reply = `✅ **Best Life Insurance Plan for Age ${userState.age}**

For your age, the most suitable option is:

• **Term Life Insurance**
• High coverage (₹50L – ₹1Cr)
• Very low premium when bought early
• Ideal for long-term family protection

This gives maximum protection at minimum cost.`;
      }

      if (userState.topic === "term insurance") {
        reply = `✅ **Best Term Insurance Plan for Age ${userState.age}**

Recommended option:

• **Level Term Plan**
• Policy term till age 60
• Fixed payout to family
• Lowest premium at young age

This is the best choice for pure financial protection.`;
      }

      if (!reply) {
        reply = `I can suggest plans and benefits for ${userState.topic}.`;
      }

      userState.stage = "explain";
      reply += "\n\nYou can ask about coverage, premium, or benefits.";

      return res.json({ reply });
    }

    return res.json({
      reply: "Would you like me to suggest the best plan for you? 😊"
    });
  }

  /* 🟢 STAGE 4: EXPLANATION */
  if (userState.stage === "explain") {

    if (msg.includes("coverage")) {
      return res.json({
        reply: "Coverage is the amount your family receives if something happens to you during the policy term."
      });
    }

    if (msg.includes("premium")) {
      return res.json({
        reply: "Premium is the yearly amount you pay. Buying early keeps premiums much lower."
      });
    }

    if (msg.includes("benefit")) {
      return res.json({
        reply: "The main benefit is financial security for your dependents at an affordable cost."
      });
    }

    return aiReply(
      `User already got a recommendation for ${userState.topic}. Answer helpfully without repeating the plan.`,
      msg,
      res
    );
  }
});

/* -----------------------------
   AI FALLBACK
-------------------------------- */
async function aiReply(systemPrompt, userMsg, res) {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      reply: response.data.choices[0].message.content
    });
  } catch {
    return res.json({
      reply: "I’m here to help 😊 You can ask about coverage, premium, benefits, or say restart."
    });
  }
}

/* -----------------------------
   SERVER
-------------------------------- */
app.listen(5001, () => {
  console.log("ORBIT AI server running on port 5001");
});
