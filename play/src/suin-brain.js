// =============================================
// SUIN BRAIN — the parts of Suin (ai-chatbot/suin.js, your chatbot) that work without its web page:
// its starter conversation examples, the real math calculator, and "what does X mean".
// These are COPIED from suin.js so City Life's classmates can use Suin's brain in chat.
// If Suin gets smarter, copy the new versions here. How classmates use it: chat.js.
// =============================================

// ---- conversation examples (suin.js: SEED_EXAMPLES / GREETING_EXAMPLES / MOOD_EXAMPLES) ----
// Starter examples Suin already knows.
const SEED_EXAMPLES = [
  { text: "hello", reply: "Hi there! 👋" },
  { text: "hi", reply: "Hey! How's it going?" },
  { text: "hey there", reply: "Hey hey! 👋" },
  { text: "good morning", reply: "Good morning to you too! ☀️" },
  { text: "how are you", reply: "I'm doing great, thanks for asking! How about you?" },
  { text: "what is your name", reply: "I'm Suin! Nice to meet you." },
  { text: "who are you", reply: "I'm Suin, a chatbot that learns from examples!" },
  { text: "bye", reply: "Bye! See you later!" },
  { text: "goodbye", reply: "Goodbye! Come back soon!" },
  { text: "thank you", reply: "You're welcome!" },
  { text: "thanks", reply: "No problem!" },
  { text: "what can you do", reply: "I can chat with you about the things I know!" }
];

// Real English greetings — casual, formal, time-of-day, and the
// question-style ones people actually use as a greeting ("what's up",
// "how's it going"). Kept to genuine, commonly-used English phrases, not
// padded with made-up ones or greetings borrowed from other languages,
// since the ask was specifically "in english."
const GREETING_EXAMPLES = [
  { text: "hiya", reply: "Hiya! 👋" },
  { text: "heya", reply: "Heya! What's up?" },
  { text: "yo", reply: "Yo! 😎" },
  { text: "sup", reply: "Not much, what's up with you?" },
  { text: "what's up", reply: "Not much! What's up with you?" },
  { text: "whats up", reply: "Not much! What's up with you?" },
  { text: "howdy", reply: "Howdy! 🤠" },
  { text: "hi there", reply: "Hi there! 👋" },
  { text: "hello there", reply: "Hello there! 👋" },
  { text: "good day", reply: "Good day to you! 🌞" },
  { text: "greetings", reply: "Greetings! 👋" },
  { text: "salutations", reply: "Salutations! That's a fancy way to say hi 😄" },
  { text: "how do you do", reply: "How do you do! Nice and formal 😄" },
  { text: "pleased to meet you", reply: "Pleased to meet you too!" },
  { text: "nice to meet you", reply: "Nice to meet you too!" },
  { text: "good afternoon", reply: "Good afternoon! ☀️" },
  { text: "good evening", reply: "Good evening! 🌆" },
  { text: "how are you doing", reply: "I'm doing great! How about you?" },
  { text: "how have you been", reply: "I've been good! How about you?" },
  { text: "how's it going", reply: "It's going great! How about you?" },
  { text: "hows it going", reply: "It's going great! How about you?" },
  { text: "what's new", reply: "Not much new with me! What's new with you?" },
  { text: "whats new", reply: "Not much new with me! What's new with you?" },
  { text: "what's going on", reply: "Not much! What's going on with you?" },
  { text: "long time no see", reply: "Long time no see! 😄" },
  { text: "welcome back", reply: "Thanks, glad to be back! 👋" },
  { text: "good to see you", reply: "Good to see you too! 😊" },
  { text: "nice to see you", reply: "Nice to see you too! 😊" },
  { text: "g'day", reply: "G'day! 🇦🇺" },
  { text: "ahoy", reply: "Ahoy there! ⚓" }
];

// Replies for the answer to "how about you?" — the natural next thing
// after a greeting, but a totally different kind of phrase than a
// greeting itself, so kept as its own list. Negative ones get a warmer,
// more caring reply instead of just a cheerful one — a kid saying "bad" or
// "sad" shouldn't get the same peppy response as "great."
const MOOD_EXAMPLES = [
  { text: "great", reply: "That's awesome! 😄" },
  { text: "good", reply: "Glad to hear it! 😊" },
  { text: "awesome", reply: "Heck yeah! 🎉" },
  { text: "amazing", reply: "That's amazing to hear! ✨" },
  { text: "fantastic", reply: "Fantastic! Love that. 🌟" },
  { text: "wonderful", reply: "Wonderful! That makes me happy. 😊" },
  { text: "excellent", reply: "Excellent! 🙌" },
  { text: "fine", reply: "Glad you're doing fine!" },
  { text: "okay", reply: "Okay is good! Hope your day gets even better." },
  { text: "alright", reply: "Glad you're doing alright!" },
  { text: "not bad", reply: "Not bad is still pretty good! 👍" },
  { text: "pretty good", reply: "Glad to hear it's pretty good!" },
  { text: "so-so", reply: "So-so days happen! Hope it picks up." },
  { text: "meh", reply: "Meh days happen. Hope tomorrow's better!" },
  { text: "bad", reply: "Aw, sorry to hear that. I hope your day gets better. 💙" },
  { text: "terrible", reply: "Oh no, I'm sorry things are terrible right now. 💙" },
  { text: "awful", reply: "That sounds really rough, I'm sorry. 💙" },
  { text: "not good", reply: "Sorry to hear that. I hope things look up soon." },
  { text: "not great", reply: "Sorry it's not going great. Hang in there!" },
  { text: "rough", reply: "Sounds like a rough time. I hope it gets easier. 💙" },
  { text: "sad", reply: "I'm sorry you're feeling sad. I'm here if you want to chat." },
  { text: "tired", reply: "Aw, sounds like you need some rest!" },
  { text: "stressed", reply: "Sorry you're feeling stressed. Take a deep breath — you've got this." }
];

// ---- word matching (suin.js: wordsOf / overlapScore) — renamed with a suin prefix so they can't clash with City Life's own names ----
// Turn a sentence into a clean list of lowercase words.
function suinWordsOf(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Count how many words two word-lists share.
function suinOverlapScore(wordsA, wordsB) {
  const setB = new Set(wordsB);
  let score = 0;
  for (const w of wordsA) {
    if (setB.has(w)) score++;
  }
  return score;
}

// ---- real math (suin.js: extractMathExpression / evalMathExpression) ----
// Turns word-forms into symbols and strips filler words, so "what is 5
// plus 3" and "5+3" both end up as the same clean string.
function extractMathExpression(text) {
  let cleaned = " " + text.toLowerCase() + " ";
  cleaned = cleaned.replace(/what'?s|what is|calculate|solve|please|equals?|=|\?/g, " ");
  cleaned = cleaned.replace(/\bplus\b/g, "+");
  cleaned = cleaned.replace(/\bminus\b/g, "-");
  cleaned = cleaned.replace(/\btimes\b|\bmultiplied by\b/g, "*");
  cleaned = cleaned.replace(/\bdivided by\b/g, "/");
  cleaned = cleaned.replace(/\bx\b/g, "*");

  const compact = cleaned.replace(/\s+/g, "");
  const hasOperator = /[+\-*/]/.test(compact);
  const onlyMathChars = /^[\d+\-*/.()]+$/.test(compact);

  return compact && hasOperator && onlyMathChars ? compact : null;
}

// A small recursive-descent parser: parseExpr handles + and - (lowest
// precedence), parseTerm handles * and / (higher precedence, so they bind
// tighter), parseFactor handles single numbers and parenthesized groups.
// Calling parseTerm from inside parseExpr (instead of just reading numbers
// directly) is the actual trick that makes "2 + 3 * 4" correctly compute
// the multiplication first.
function evalMathExpression(expr) {
  const tokens = expr.match(/\d+\.?\d*|[+\-*/()]/g) || [];
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseFactor() {
    if (peek() === "(") {
      next();
      const val = parseExpr();
      next(); // consume ")"
      return val;
    }
    if (peek() === "-") {
      next();
      return -parseFactor();
    }
    return parseFloat(next());
  }

  function parseTerm() {
    let val = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const rhs = parseFactor();
      val = op === "*" ? val * rhs : val / rhs;
    }
    return val;
  }

  function parseExpr() {
    let val = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const rhs = parseTerm();
      val = op === "+" ? val + rhs : val - rhs;
    }
    return val;
  }

  return parseExpr();
}

// ---- "what does X mean" (suin.js: extractDefinitionQuery) ----
// Matches "what does X mean", "what is the meaning of X", "define X".
function extractDefinitionQuery(text) {
  const t = text.toLowerCase().trim().replace(/\?+$/, "");
  const patterns = [/^what does (.+?) mean$/, /^what's (.+?) mean$/, /^what is the meaning of (.+)/, /^define (.+)/];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1].trim();
  }
  return null;
}
