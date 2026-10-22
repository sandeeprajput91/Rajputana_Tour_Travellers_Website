/**
 * Rajputana Tour & Travellers - AI Travel Genie
 * Travel-Only AI Consultant Engine
 * Strictly bound to Rajasthan Tour Planning, Car Rental, Tempo Travellers & Rajputana Services
 */

(function () {
  const AI_STATE = {
    isOpen: false,
    history: []
  };

  function initAIAssistant() {
    const toggleBtn = document.getElementById("aiToggleBtn");
    const chatWindow = document.getElementById("aiChatWindow");
    const closeBtn = document.getElementById("aiCloseBtn");
    const sendBtn = document.getElementById("aiSendBtn");
    const inputField = document.getElementById("aiInput");
    const chipsContainer = document.getElementById("aiPromptChips");

    if (!toggleBtn || !chatWindow) return;

    toggleBtn.addEventListener("click", () => {
      AI_STATE.isOpen = !AI_STATE.isOpen;
      chatWindow.classList.toggle("hidden", !AI_STATE.isOpen);
      if (AI_STATE.isOpen) {
        inputField?.focus();
        if (AI_STATE.history.length === 0) {
          sendWelcomeMessage();
        }
      }
    });

    closeBtn?.addEventListener("click", () => {
      AI_STATE.isOpen = false;
      chatWindow.classList.add("hidden");
    });

    sendBtn?.addEventListener("click", () => handleUserSend());
    inputField?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleUserSend();
    });

    // Populate suggested prompt chips
    const samplePrompts = [
      { text: "Jaipur Sightseeing Plan", query: "What is included in Jaipur full day sightseeing?" },
      { text: "Fare to Udaipur", query: "What is the taxi fare from Jaipur to Udaipur?" },
      { text: "Tempo Traveller Capacity", query: "Tell me about Tempo Traveller options for a family group" },
      { text: "Airport Transfer Rates", query: "How much is taxi for Jaipur Airport pickup?" },
      { text: "Is Advance Required?", query: "Is advance payment compulsory for booking?" }
    ];

    if (chipsContainer) {
      chipsContainer.innerHTML = "";
      samplePrompts.forEach(p => {
        const chip = document.createElement("button");
        chip.className = "ai-chip";
        chip.textContent = p.text;
        chip.onclick = () => {
          if (inputField) {
            inputField.value = p.query;
            handleUserSend();
          }
        };
        chipsContainer.appendChild(chip);
      });
    }
  }

  function sendWelcomeMessage() {
    const currentLang = window.currentLanguage || "en";
    const welcome = currentLang === "hi"
      ? "खम्मा घणी! 🙏 मैं **राजपूताना ट्रेवल जिनी** हूँ। मैं केवल राजस्थान यात्रा, टैक्सी बुकिंग, टेम्पो ट्रैवलर एवं टूर पैकेज में आपकी सहायता कर सकता हूँ। आप क्या जानना चाहते हैं?"
      : "Khamma Ghani! 🙏 I am **Rajputana Travel Genie**, your personal travel consultant for Rajasthan. How can I help plan your trip, taxi, or Tempo Traveller booking today?";
    
    appendMessage(welcome, "bot");
  }

  function handleUserSend() {
    const inputField = document.getElementById("aiInput");
    if (!inputField) return;
    const q = inputField.value.trim();
    if (!q) return;

    appendMessage(q, "user");
    inputField.value = "";

    // Show simulated typing
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const response = generateAIResponse(q);
      appendMessage(response, "bot");
    }, 600);
  }

  function generateAIResponse(query) {
    const qLower = query.toLowerCase();
    const currentLang = window.currentLanguage || "en";
    const data = window.RTT_DATA?.aiKnowledge;

    if (!data) return "Service is currently loading. Please call +91 9829837082.";

    // Guardrail: Strictly check if query is travel / Rajasthan related
    const travelTerms = [
      "jaipur", "udaipur", "jodhpur", "jaisalmer", "pushkar", "ajmer", "ranthambore",
      "delhi", "agra", "taxi", "cab", "car", "innova", "dzire", "aura", "tempo", "traveller",
      "fare", "rate", "cost", "price", "km", "tour", "package", "sightseeing", "visit", "trip",
      "airport", "pickup", "drop", "driver", "book", "advance", "payment", "razorpay", "cancel",
      "refund", "kalu", "kuldeep", "contact", "phone", "whatsapp", "hotel", "fort", "palace",
      "amber", "hawa mahal", "city palace", "chittorgarh", "mount abu", "salasar", "khatu", "bilingual",
      "english", "hindi", "international", "foreigner", "tourist", "luggage", "seats", "capacity", "ac",
      "hello", "hi", "hey", "namaste", "khamma ghani"
    ];

    const isTravelRelated = travelTerms.some(term => qLower.includes(term));

    if (!isTravelRelated) {
      return currentLang === "hi"
        ? "क्षमा करें, मैं केवल **राजपूताना टूर एंड ट्रेवलर्स** और राजस्थान यात्रा संबंधी प्रश्नों (टैक्सी बुकिंग, दर्शनीय स्थल, दरें, टेम्पो ट्रैवलर) के उत्तर देने के लिए अधिकृत हूँ। कृपया यात्रा संबंधी प्रश्न पूछें।"
        : "I apologize, but I am programmed specifically as a travel consultant for **Rajputana Tour & Travellers**. I can only assist with Rajasthan itineraries, taxi/cab bookings, Tempo Travellers, airport transfers, and company tariff. Please ask a travel-related question!";
    }

    // Match with knowledge base intents
    for (const item of data.intents) {
      if (item.keywords.some(k => qLower.includes(k))) {
        return currentLang === "hi" ? item.hi : item.en;
      }
    }

    // Fallback default response
    return currentLang === "hi" ? data.defaultResponse.hi : data.defaultResponse.en;
  }

  function showTypingIndicator() {
    const body = document.getElementById("aiChatBody");
    if (!body) return;
    const typing = document.createElement("div");
    typing.id = "aiTyping";
    typing.className = "ai-msg bot";
    typing.innerHTML = "<em>Travel Genie is typing...</em>";
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("aiTyping");
    if (typing) typing.remove();
  }

  function appendMessage(text, sender) {
    const body = document.getElementById("aiChatBody");
    if (!body) return;

    const msg = document.createElement("div");
    msg.className = `ai-msg ${sender}`;

    // Format markdown bold & line breaks
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    // If bot and contains bookable keyword, add quick CTA
    if (sender === "bot" && (text.includes("₹") || text.includes("book") || text.includes("किराया"))) {
      formatted += `<div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
        <a href="#book" class="btn btn-sm btn-navy" style="font-size:0.75rem; padding:4px 10px;" onclick="document.getElementById('aiChatWindow').classList.add('hidden');">⚡ Book This Ride</a>
        <a href="https://wa.me/919829837082?text=Hello%20Rajputana%20Travellers,%20I%20need%20a%20taxi%20booking" target="_blank" class="btn btn-sm btn-whatsapp" style="font-size:0.75rem; padding:4px 10px;">💬 WhatsApp</a>
      </div>`;
    }

    msg.innerHTML = formatted;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;

    AI_STATE.history.push({ sender, text });
  }

  window.initAIAssistant = initAIAssistant;
})();
