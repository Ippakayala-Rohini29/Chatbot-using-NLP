// ===================== CONFIG =====================
// Optionally add your HuggingFace API key to enable real AI responses.
// If HF_API_KEY is empty, the bot uses built-in smart fallback replies.
const HF_API_KEY = ""; // <-- optional: "hf_xxx..."

// Model to call (HuggingFace hosted); change if you want another model.
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

// ==================================================

/* DOM */
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const tpl = document.getElementById("tpl-message");

/* small helper to append message */
function appendMessage(text, who = "bot") {
  const node = tpl.content.cloneNode(true);
  const msg = node.querySelector(".message");
  msg.className = "message " + (who === "user" ? "user" : "bot");
  node.querySelector(".bubble").innerText = text;
  const now = new Date();
  node.querySelector(".time").innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  chatWindow.appendChild(node);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* typing animation (simple) */
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "message bot typing";
  typing.innerHTML = `<div class="bubble">Chat Boy is typing<span class="dots">...</span></div><time class="time"></time>`;
  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return typing;
}

/* remove typing node */
function removeNode(node) {
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

/* RULE-BASED fallback 'smart' replies */
function fallbackReply(userText) {
  const t = userText.toLowerCase();

  // small intents
  if (/hi|hello|hey|hii\b/.test(t)) return "Hello! I'm Chat Boy — how can I help you today?";
  if (/how are you|how's it going/.test(t)) return "I'm just code, but I'm doing great — thanks for asking! 😊";
  if (/your name|who are you/.test(t)) return "I'm Chat Boy, your friendly assistant built for this demo.";
  if (/joke|tell me a joke/.test(t)) return "Why did the computer show up at work late? It had a hard drive! 😄";
  if (/what is ai|explain ai|define ai/.test(t)) return "AI means using computers to perform tasks that normally require human intelligence — like language, vision, and decision-making.";
  if (/bye|goodbye|see you/.test(t)) return "Goodbye! Have a nice day — come back anytime.";
  if (/thank/.test(t)) return "You're welcome! Happy to help.";
  if (t.length < 15) return "I can help with many things — ask me to explain, define, or tell a joke!";
  
  // last fallback
  return "That's interesting — can you please tell me more or ask in a different way?";
}

/* call HuggingFace inference API (if API key provided) */
async function callHFModel(message) {
  if (!HF_API_KEY) throw new Error("No HF key");
  try {
    const res = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: message })
    });
    const data = await res.json();
    // HF inference may return text in different shapes, handle common cases:
    if (data.error) throw new Error(data.error);
    if (Array.isArray(data) && data.length && data[0].generated_text) return data[0].generated_text;
    if (data.generated_text) return data.generated_text;
    if (data[0] && data[0].generated_text) return data[0].generated_text;
    // fallback: return stringified response
    return JSON.stringify(data);
  } catch (err) {
    console.warn("HF call failed:", err);
    throw err;
  }
}

/* main handler */
async function handleUserMessage(text) {
  appendMessage(text, "user");
  userInput.value = "";
  
  // show typing
  const typingNode = showTyping();

  // prefer HF if key provided
  if (HF_API_KEY) {
    try {
      const botText = await callHFModel(text);
      removeNode(typingNode);
      appendMessage(botText, "bot");
      return;
    } catch (err) {
      // if HF fails, fall back to local
      removeNode(typingNode);
      const fb = fallbackReply(text);
      appendMessage(fb, "bot");
      return;
    }
  }

  // no HF key — use local fallback (smart-ish)
  await new Promise(r => setTimeout(r, 600)); // small delay for UX
  removeNode(typingNode);
  const reply = fallbackReply(text);
  appendMessage(reply, "bot");
}

/* events */
chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  handleUserMessage(text);
});

/* initial greeting */
window.addEventListener("load", () => {
  appendMessage("Hi! I'm Chat Boy — ask me anything. (No translator here!)", "bot");
  userInput.focus();
});