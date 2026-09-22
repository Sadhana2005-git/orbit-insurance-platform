const messages = document.getElementById("messages");
const input = document.getElementById("input");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerText = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage(customText = null) {
  const text = customText || input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const typing = document.createElement("div");
  typing.className = "message bot";
  typing.innerText = "ORBIT is typing…";
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    messages.removeChild(typing);
    addMessage(data.reply, "bot");

  } catch {
    messages.removeChild(typing);
    addMessage("⚠️ Something went wrong. Please try again.", "bot");
  }
}

/* Smart quick buttons */
function quickSend(type) {
  const map = {
    plans: "show me the plans",
    coverage: "explain coverage",
    premium: "explain premium",
    benefits: "explain benefits",
    restart: "restart"
  };
  sendMessage(map[type]);
}

input.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

/* Welcome */
addMessage(
  "Hi 👋 I’m ORBIT. I can help you choose the right insurance plan. Just tell me what you’re looking for.",
  "bot"
);
