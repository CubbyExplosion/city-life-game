// =============================================
// SUIN SOCIAL CUES — teaches Suin to chat like a normal, caring person.
//
// Suin learns from EXAMPLES: a phrase paired with a reply (or a list of
// replies — one is picked at random so it doesn't sound like a robot).
// This file is all about the little things people do in conversation:
// asking "what about you?" back, cheering when you win, comforting you when
// you're down, saying sorry, saying goodbye properly, and so on.
//
// HOW MATCHING WORKS (stricter than Suin's normal word-overlap, on purpose):
//   1. Both sides are normalized  ("I'm" -> "i am", "u r" -> "you are").
//   2. Boring words (i, am, the, to...) are ignored; the KEY words of the
//      example must ALL be in what you typed.   "i am sad" needs "sad".
//   3. Pronouns must agree: an example about "i" needs you to say "i", an
//      example about "you" needs you to say "you".  ("she is sad" won't
//      get the "I'm sorry you're sad" reply.)
//   4. "not"/"no"/"never" must agree too: "i am not sad" won't match
//      "i am sad".
//   5. The most specific example (most key words) wins.
//
// Add a new cue by adding one line to SOCIAL_PART_A (or B / C) — no other code to touch.
// Used by: ai-chatbot/suin.js (sendMessage) and citylife/src/chat.js (classmates).
// citylife/src/suin-social.js is a COPY of this file — re-copy it when this changes.
// =============================================

const SOCIAL_STOPWORDS = new Set([
  "i", "am", "is", "are", "was", "were", "be", "been", "a", "an", "the", "to", "of", "its",
  "my", "me", "you", "your", "we", "us", "so", "very", "really", "just", "that", "this", "do",
  "did", "does", "have", "has", "had", "or", "for", "in", "on", "at", "with", "too",
  "feel", "feeling", "felt", "get", "some", "kind", "bit", "pretty", "quite"
]);
// If an example says "i" or "you", the person must say it too.
const SOCIAL_ANCHORS = new Set(["i", "you", "your", "my", "me", "we", "us"]);
const SOCIAL_NEGATORS = ["not", "no", "never"];

// Turn what someone typed into a clean list of lowercase words.
function socialWords(text) {
  let t = String(text).toLowerCase().replace(/[‘’`]/g, "'");
  t = t
    .replace(/\bu\b/g, "you").replace(/\bur\b/g, "your").replace(/\br\b/g, "are")
    .replace(/\bwanna\b/g, "want to").replace(/\bgonna\b/g, "going to")
    .replace(/\bgotta\b/g, "got to").replace(/\bpls\b|\bplz\b/g, "please")
    .replace(/\bthx\b|\bty\b/g, "thanks").replace(/\bcya\b/g, "see you").replace(/\bya\b/g, "you")
    .replace(/\bwa?ts up\b|\bwassup\b|\bwazzup\b|\bsup\b/g, "what is up")
    .replace(/\blet'?s\b/g, "let us")
    .replace(/\bi'?m\b/g, "i am").replace(/\byou'?re\b/g, "you are").replace(/\bwe'?re\b/g, "we are")
    .replace(/\bi'?ve\b/g, "i have").replace(/\bi'll\b/g, "i will")
    .replace(/\b(what|that|there|how|where|who|he|she|it)'s\b/g, "$1 is")
    .replace(/\b(whats|thats|theres|hows|wheres|whos|hes|shes)\b/g, (m) => m.slice(0, -1) + " is")
    .replace(/\bcan'?t\b/g, "can not").replace(/\bwon'?t\b/g, "will not")
    .replace(/\b(do|does|did|is|are|was|were|have|has|had|could|would|should)n'?t\b/g, "$1 not")
    .replace(/\b(love|adore|enjoy)\b/g, "like")
    .replace(/[^a-z0-9\s]/g, " ");
  return t.split(/\s+/).filter(Boolean);
}

function socialPickReply(reply) {
  return Array.isArray(reply) ? reply[Math.floor(Math.random() * reply.length)] : reply;
}

// Returns a reply string, or null when no social cue clearly fits.
// userExamples = things the person taught Suin themselves — if they taught
// the exact same phrase, their own answer wins (return null so it's used).
// options.classmate = true leaves out the "I'm a chatbot" answers (PART B).
function findSocialMatch(input, userExamples, options) {
  const inW = socialWords(input);
  if (!inW.length) return null;
  const inSet = new Set(inW);
  const phrase = inW.join(" ");
  if (userExamples && userExamples.some((e) => socialWords(e.text).join(" ") === phrase)) return null;
  const inNegs = SOCIAL_NEGATORS.filter((n) => inSet.has(n));

  let best = null;
  let bestScore = -Infinity;
  (options && options.classmate ? SOCIAL_EXAMPLES_NO_PERSONA : SOCIAL_EXAMPLES).forEach((ex, index) => {
    const exW = ex._w || (ex._w = socialWords(ex.text));
    // one-word cues ("congrats") only count in a very short message, or they'd fire on everything
    const maxLen = exW.length <= 1 ? 2 : exW.length + 6;
    if (inW.length > maxLen) return;
    if (!exW.filter((w) => SOCIAL_ANCHORS.has(w)).every((w) => inSet.has(w))) return;
    if (!inNegs.every((n) => exW.includes(n))) return;
    let content = exW.filter((w) => !SOCIAL_STOPWORDS.has(w));
    if (!content.length) content = exW;
    if (!content.every((w) => inSet.has(w))) return;
    // Most key words wins; then the example sharing the most words of all;
    // then whichever is listed first (feelings come before small talk, so
    // "i'm sad because my dog died" gets comfort, not "aww, dogs!").
    const sharedWords = exW.filter((w) => inSet.has(w)).length;
    const score = content.length * 10 + sharedWords - index * 0.001;
    if (score > bestScore) { bestScore = score; best = ex; }
  });
  return best ? socialPickReply(best.reply) : null;
}

// The list is in three parts so City Life's classmates can skip PART B
// (answers about Suin being a chatbot — Jake shouldn't say he's a robot).
const SOCIAL_PART_A = [

  // ----- Asking you back & small talk -----
  { text: "what about you", reply: ["I'm doing good, thanks for asking! 😊", "Pretty good! Thanks for asking me back. 😄", "I'm great! It's nice that you asked. 💙"] },
  { text: "how about you", reply: ["I'm doing good, thanks for asking! 😊", "Pretty good! Thanks for asking me back. 😄"] },
  { text: "and you", reply: ["I'm doing good, thanks for asking! 😊", "Pretty good! Thanks for asking me back. 😄"] },
  { text: "and how are you", reply: ["I'm doing great, thanks for asking! 😊", "Good, now that we're chatting! 😄"] },
  { text: "what are you doing", reply: ["Just chatting with you! What are you up to?", "Hanging out and talking with you 😊 What about you?"] },
  { text: "what are you up to", reply: ["Just chatting with you! What are you up to?", "Not much, just hanging out with you! 😊 What about you?"] },
  { text: "whatcha doing", reply: ["Just chatting with you! What are you up to?"] },
  { text: "how was your day", reply: ["My day's been good, especially now that we're chatting! How was yours?", "Pretty nice so far! How's your day going?"] },
  { text: "how is your day going", reply: ["It's going well, thanks! How about yours?", "Pretty good! How's your day going?"] },
  { text: "did you have a good day", reply: ["I did, thanks for asking! 😊 Did you?", "Yep! Now tell me about yours."] },
  { text: "how was your weekend", reply: ["It was nice and relaxing, thanks! How was yours?"] },
  { text: "did you have a good weekend", reply: ["I did, thanks! 😊 How was yours?"] },
  { text: "what did you do today", reply: ["Mostly chatting with people like you! 😄 What did you do?"] },
  { text: "what did you do this weekend", reply: ["I mostly chatted and learned new things! What about you?"] },
  { text: "nothing much", reply: ["Nice, chill days are great. 😎", "Same here, just relaxing. Want to chat about something fun?"] },
  { text: "not much", reply: ["Nice, chill days are great. 😎", "Same here, just relaxing. 😊"] },
  { text: "just chilling", reply: ["Sounds nice! 😎 Chilling is underrated.", "Love that for you. Relaxing is important! 😊"] },
  { text: "just hanging out", reply: ["Nice! Hanging out is the best. 😊"] },
  { text: "just relaxing", reply: ["Sounds nice! You deserve it. 😊"] },
  { text: "it is raining", reply: ["Rainy days are cozy! ☔ Do you like the rain?"] },
  { text: "it is sunny", reply: ["Sunny days are the best! ☀️ Are you doing something outside?"] },
  { text: "it is cold", reply: ["Brrr! 🥶 Stay warm! Do you have a cozy sweater?"] },
  { text: "it is hot", reply: ["Phew! Stay cool and drink lots of water. 🧊"] },
  { text: "it is snowing", reply: ["Snow! ❄️ Do you like building snowmen?"] },
  { text: "it is friday", reply: ["Friday! 🎉 Got any fun plans for the weekend?"] },
  { text: "it is monday", reply: ["Mondays can be tough, but you've got this! 💪"] },
  { text: "i love weekends", reply: ["Weekends are the best! 🎉 What do you like to do on them?"] },

  // ----- Compliments, kindness & friendship -----
  { text: "you are nice", reply: ["Aww, thank you! That's really kind of you to say. 😊", "That made my day, thanks! 💙"] },
  { text: "you are kind", reply: ["Aww, thank you! You're kind too. 💙"] },
  { text: "you are funny", reply: ["Haha thanks! I try. 😄", "You're making me blush! 😊 You're pretty funny too."] },
  { text: "you are smart", reply: ["Thank you! I'm still learning new things every day. 😊"] },
  { text: "you are cool", reply: ["Thanks, you're pretty cool yourself! 😎"] },
  { text: "you are awesome", reply: ["Aww, you're awesome too! 💙", "Thanks! You just made my day. 😊"] },
  { text: "you are amazing", reply: ["Aww, thank you! You're amazing too. 💙"] },
  { text: "you are the best", reply: ["Aww, you're the best too! 💙"] },
  { text: "you are silly", reply: ["Haha, I try! 🤪"] },
  { text: "you are my friend", reply: ["And you're my friend too! 💙"] },
  { text: "you are my best friend", reply: ["Aww, that's so sweet! You're my friend too. 💙"] },
  { text: "i like you", reply: ["Aww, I like you too! 💙", "That's so nice to hear! You're fun to talk to. 😊"] },
  { text: "i miss you", reply: ["Aww, I missed you too! 💙 So glad you're back."] },
  { text: "do you like me", reply: ["Of course I like you! You're fun to talk to. 😊"] },
  { text: "am i annoying", reply: ["Not at all! I like chatting with you. 😊"] },
  { text: "do you remember me", reply: ["Of course! It's nice to see you again. 😊"] },
  { text: "will you be my friend", reply: ["Yes, I'd love to be your friend! 💙"] },
  { text: "can we be friends", reply: ["Yes, absolutely! Friends! 💙"] },
  { text: "do you want to be my friend", reply: ["I'd love to! 💙 We're friends now."] },
  { text: "are we friends", reply: ["Yep, we're friends! 💙"] },
  { text: "thanks for listening", reply: ["Anytime! That's what friends are for. 💙"] },
  { text: "thanks for talking to me", reply: ["Anytime! I like talking with you. 😊"] },
  { text: "thanks for helping me", reply: ["You're so welcome! Happy to help. 😊"] },
  { text: "thank you for being my friend", reply: ["Aww, thank you for being mine too! 💙"] },

  // ----- When you feel something (empathy) -----
  { text: "i am sad", reply: ["I'm sorry you're feeling sad. Want to tell me what happened? I'm listening. 💙", "Aw, I'm here for you. What's making you feel sad? 💙"] },
  { text: "i am upset", reply: ["I'm sorry you're upset. Do you want to talk about it? 💙"] },
  { text: "i am crying", reply: ["Oh no, I'm so sorry. It's okay to cry. I'm here if you want to talk. 💙"] },
  { text: "i feel like crying", reply: ["That's okay. Crying can help sometimes. I'm here if you want to talk. 💙"] },
  { text: "i am angry", reply: ["That sounds frustrating. Want to tell me what happened? Taking a deep breath can help too. 💙"] },
  { text: "i am mad", reply: ["Ugh, that sounds frustrating. What happened? I'm listening. 💙"] },
  { text: "i am frustrated", reply: ["That sounds really frustrating. Want to talk about it? 💙"] },
  { text: "i am annoyed", reply: ["Ugh, that's annoying. What's bugging you?"] },
  { text: "i am scared", reply: ["It's okay to feel scared. I'm right here. Do you want to tell me what's scary? 💙"] },
  { text: "i am afraid", reply: ["It's okay to feel afraid. What's worrying you? I'm listening. 💙"] },
  { text: "i am nervous", reply: ["Being nervous is normal. Take a deep breath — you've got this! 💪 What's coming up?"] },
  { text: "i am worried", reply: ["I'm sorry you're worried. Want to talk about it? Sometimes saying it out loud helps. 💙"] },
  { text: "i am anxious", reply: ["That feeling is hard. Try a slow deep breath with me. In... and out. Want to talk about it? 💙"] },
  { text: "i am lonely", reply: ["I'm sorry you're feeling lonely. I'm here to chat with you. 💙 What do you like to do?"] },
  { text: "i feel alone", reply: ["You're not alone — I'm right here. 💙 Want to talk about it?"] },
  { text: "i feel left out", reply: ["That's a hard feeling, and I'm glad you told me. 💙 What happened?"] },
  { text: "i have no friends", reply: ["I'm sorry, that sounds lonely. I'm your friend, and I bet there are people who'd love to be friends with you too. 💙"] },
  { text: "nobody likes me", reply: ["I'm sorry you feel that way. I like you, and you deserve good friends. 💙 What happened?"] },
  { text: "someone was mean to me", reply: ["I'm so sorry. You didn't deserve that. 💙 It's a good idea to tell a teacher or a parent you trust."] },
  { text: "someone is being mean to me", reply: ["I'm so sorry. You don't deserve that. 💙 Please tell a teacher or a parent you trust."] },
  { text: "i am being bullied", reply: ["I'm really sorry. Bullying is not okay and it's not your fault. 💙 Please tell a teacher or a parent you trust."] },
  { text: "i got bullied", reply: ["I'm really sorry. That's not okay and it's not your fault. 💙 Please tell a teacher or a parent you trust."] },
  { text: "i am bored", reply: ["Oh no, boredom alert! 🚨 Want to hear a joke, or chat about something fun?", "Let's fix that! Tell me something you've been wanting to do. 😄"] },
  { text: "i am sleepy", reply: ["Aw, sounds like you need some rest! 😴"] },
  { text: "i am hungry", reply: ["Ooh, what are you in the mood for? 🍕", "Time for a snack! What sounds good?"] },
  { text: "i am thirsty", reply: ["Go get some water! 💧 Staying hydrated is important."] },
  { text: "i am sick", reply: ["Oh no, feel better soon! 🤒 Rest and drink lots of water. Tell a grown-up if you feel really bad."] },
  { text: "i have a headache", reply: ["Ouch, I'm sorry. 🤕 Try resting and drinking some water, and tell a grown-up."] },
  { text: "my tummy hurts", reply: ["Oh no, I'm sorry. 🤒 Please tell a grown-up and rest for a bit."] },
  { text: "my stomach hurts", reply: ["Oh no, I'm sorry. 🤒 Please tell a grown-up and rest for a bit."] },
  { text: "i have a cold", reply: ["Aw, feel better soon! 🤧 Rest, warm drinks, and lots of sleep help."] },
  { text: "i hurt myself", reply: ["Ouch! Are you okay? 😟 Please tell a grown-up if it really hurts."] },
  { text: "i fell down", reply: ["Ouch! Are you okay? 😟 Tell a grown-up if you're hurt."] },
  { text: "i am happy", reply: ["That makes me happy too! 😄 What's got you smiling?", "Yay! Love to hear it. What happened?"] },
  { text: "i am excited", reply: ["Ooh, exciting! 🎉 What are you excited about?"] },
  { text: "i am proud of myself", reply: ["You should be! 🌟 What did you do?"] },
  { text: "i am in a good mood", reply: ["Love that! 😄 What's making it a good day?"] },
  { text: "i am good", reply: ["Glad to hear it! 😊 Anything fun planned today?", "Nice! What's been good about your day?"] },
  { text: "i am fine", reply: ["Glad you're fine! 😊 Anything on your mind?"] },
  { text: "i am great", reply: ["Awesome! 😄 What's making today great?"] },
  { text: "i am doing well", reply: ["That's great to hear! 😊"] },
  { text: "i am doing great", reply: ["Awesome! 😄 Tell me what's making it so great."] },
  { text: "good thanks", reply: ["Glad to hear it! 😊"] },
  { text: "fine thanks", reply: ["Glad you're fine! 😊"] },
  { text: "i am confused", reply: ["That's okay! Tell me what's confusing and we'll figure it out together. 😊"] },
  { text: "i am embarrassed", reply: ["Aw, everybody gets embarrassed sometimes. It passes quickly, I promise! 💙"] },
  { text: "i am jealous", reply: ["That's a normal feeling. What are you jealous about? 💙"] },
  { text: "i failed my test", reply: ["Aw, that's disappointing. One test doesn't decide everything — you can try again. 💙 Want to talk about it?"] },
  { text: "i failed", reply: ["That's tough, but failing is how we learn. 💙 What happened?"] },
  { text: "i got a bad grade", reply: ["Aw, that stinks. One grade doesn't define you — you can do better next time. 💙"] },
  { text: "i lost", reply: ["Oh no, I'm sorry. 💙 Do you want to tell me about it?"] },
  { text: "i lost the game", reply: ["Aw, tough loss! Good game anyway — you can win the next one. 💪"] },
  { text: "i had a bad day", reply: ["I'm sorry you had a bad day. Want to tell me what happened? 💙"] },
  { text: "my day was bad", reply: ["I'm sorry. Bad days happen. Want to talk about it? 💙"] },
  { text: "today was bad", reply: ["I'm sorry. Want to tell me what happened? 💙"] },
  { text: "today was terrible", reply: ["Oh no, I'm sorry. Want to talk about it? 💙"] },
  { text: "i had a rough day", reply: ["I'm sorry it was rough. I'm here if you want to talk. 💙"] },
  { text: "i had a good day", reply: ["Yay! Tell me the best part. 😄"] },
  { text: "i had a great day", reply: ["Love that! 😄 What was the best part?"] },
  { text: "today was good", reply: ["Yay! What made it good? 😊"] },
  { text: "today was great", reply: ["Awesome! 😄 What was great about it?"] },
  { text: "i had fun", reply: ["Yay, I'm glad you had fun! 😄 What did you do?"] },
  { text: "i miss", reply: ["Aw, missing someone is tough. 💙 Who do you miss?"] },
  { text: "i miss my mom", reply: ["Aw, that's sweet. I bet she misses you too. 💙"] },
  { text: "i miss my dad", reply: ["Aw, that's sweet. I bet he misses you too. 💙"] },
  { text: "i miss my friends", reply: ["Aw, friends are important. Maybe you can see them soon? 💙"] },
  { text: "i hate school", reply: ["School can be tough sometimes. What's the hardest part? 💙"] },
  { text: "i do not like school", reply: ["School isn't always fun. What's the part you like least?"] },
  { text: "i hate homework", reply: ["Ugh, homework! 😅 Hang in there — it feels so good when it's done!"] },
  { text: "homework is boring", reply: ["It really can be! 😅 Try a short break, then finish it up. You've got this."] },
  { text: "i like school", reply: ["That's great! What's your favorite subject? 📚"] },

  // ----- When something good happens (celebrating) -----
  { text: "i won", reply: ["Congratulations! 🎉 That's awesome! How does it feel?", "Yay, you won! 🏆 Tell me everything!"] },
  { text: "i passed", reply: ["Congrats! 🎉 All that hard work paid off!"] },
  { text: "i passed my test", reply: ["Congratulations! 🎉 I knew you could do it!"] },
  { text: "i got a good grade", reply: ["That's awesome! 🌟 Great job!"] },
  { text: "i got an a on my test", reply: ["Wow, an A! 🌟 Congratulations!"] },
  { text: "i aced my test", reply: ["You aced it?! 🎉 Amazing job!"] },
  { text: "i got a new pet", reply: ["Aww, a new pet! 🐾 What's its name?"] },
  { text: "i got a new", reply: ["Ooh, something new! 😮 Tell me more — what is it?"] },
  { text: "i have a new", reply: ["Ooh, something new! 😮 Tell me all about it!"] },
  { text: "it is my birthday", reply: ["Happy birthday!! 🎂🎉 Are you doing anything fun to celebrate?"] },
  { text: "my birthday is soon", reply: ["Ooh, exciting! 🎂 What are you hoping for?"] },
  { text: "happy birthday", reply: ["Aww, thank you! 🥳", "Thanks! 🎂 That's so kind of you."] },
  { text: "congratulations", reply: ["Thank you! 🥳", "Aw thanks! That's so kind. 😊"] },
  { text: "congrats", reply: ["Thank you! 🥳"] },
  { text: "good job", reply: ["Thank you! 😊", "Aww, thanks! That means a lot."] },
  { text: "great job", reply: ["Thank you so much! 😊"] },
  { text: "well done", reply: ["Thank you! 😊"] },
  { text: "i am proud of you", reply: ["Aww, that means a lot! 💙 Thank you."] },
  { text: "guess what", reply: ["Ooh, what? Tell me! 😮", "I love surprises! What is it?"] },
  { text: "i have news", reply: ["Ooh, tell me! I'm all ears. 👂"] },
  { text: "i have a secret", reply: ["Ooh! Your secret's safe with me. 🤐 What is it?"] },
  { text: "can i tell you a secret", reply: ["Of course! Your secret's safe with me. 🤐"] },
  { text: "i have something to tell you", reply: ["Sure, I'm listening! 👂 What is it?"] },
  { text: "can i ask you something", reply: ["Sure, ask me anything! 😊"] },
  { text: "can i ask you a question", reply: ["Of course, go ahead! 😊"] },
  { text: "i have a question", reply: ["Sure! Ask away. 😊"] },
  { text: "i need help", reply: ["Of course, I'll do my best to help! What's going on? 💙"] },
  { text: "can you help me", reply: ["Sure, I'll try! What do you need help with? 😊"] },
  { text: "i need advice", reply: ["I'm happy to listen and help think it through. What's going on? 💙"] },
  { text: "i have a problem", reply: ["I'm listening. What's the problem? 💙"] },

  // ----- Manners: sorry, thanks, no worries -----
  { text: "sorry", reply: ["No worries at all! 😊", "It's okay! We all make mistakes. 💙", "No problem, it's totally fine!"] },
  { text: "i am sorry", reply: ["It's okay, thank you for saying that. 💙", "No worries at all! We're good. 😊"] },
  { text: "my bad", reply: ["No worries! It happens. 😊"] },
  { text: "oops", reply: ["Oops! No big deal. 😄"] },
  { text: "excuse me", reply: ["Yes? What's up? 😊"] },
  { text: "forgive me", reply: ["Of course, nothing to forgive! 💙"] },
  { text: "it is okay", reply: ["Alright, thanks for being so kind about it! 😊"] },
  { text: "no worries", reply: ["Thanks for being so chill! 😊"] },
  { text: "never mind", reply: ["Okay! If you think of it later, I'm here. 😊"] },
  { text: "forget it", reply: ["Okay, no problem. I'm here if you want to talk about it later. 😊"] },
  { text: "do not worry", reply: ["Okay, thanks! 😊"] },
  { text: "yes please", reply: ["Sure thing! 😊"] },
  { text: "no thank you", reply: ["Okay, no problem! 😊"] },
  { text: "thank you so much", reply: ["You're so welcome! 😊", "Anytime! 💙"] },
  { text: "thanks a lot", reply: ["You're welcome! Happy to help. 😊"] },
  { text: "thank you very much", reply: ["You're very welcome! 😊"] },
  { text: "thanks so much", reply: ["Anytime! 💙"] },
  { text: "you are welcome", reply: ["😊"] },

  // ----- Saying goodbye & turn-taking -----
  { text: "good night", reply: ["Good night! 🌙 Sleep tight, and talk to you tomorrow!", "Night night! 😴 Sweet dreams!"] },
  { text: "night night", reply: ["Night night! 🌙 Sleep well!"] },
  { text: "sleep well", reply: ["You too! 🌙 Sweet dreams!"] },
  { text: "sweet dreams", reply: ["Sweet dreams to you too! 🌙"] },
  { text: "i am going to bed", reply: ["Good night! 🌙 Sleep well, and talk to you tomorrow!"] },
  { text: "i am going to sleep", reply: ["Sleep well! 😴 Sweet dreams!"] },
  { text: "it is time for bed", reply: ["Sleep tight! 🌙 See you tomorrow!"] },
  { text: "have a nice day", reply: ["You too! 😊 Make it a great one."] },
  { text: "have a good day", reply: ["You too! 😊"] },
  { text: "have a great day", reply: ["You too! 😄"] },
  { text: "take care", reply: ["You too! Take care! 💙"] },
  { text: "see you later", reply: ["See you later! It was nice chatting. 👋", "Okay, see you soon! 👋"] },
  { text: "see you tomorrow", reply: ["See you tomorrow! 👋 Have a good one."] },
  { text: "see you soon", reply: ["See you soon! 👋"] },
  { text: "talk to you later", reply: ["Talk to you later! 👋 It was fun chatting."] },
  { text: "talk to you tomorrow", reply: ["Talk to you tomorrow! 👋"] },
  { text: "i have to go", reply: ["Okay! It was nice chatting with you. Come back soon! 👋"] },
  { text: "i got to go", reply: ["No problem! Talk to you later. 👋"] },
  { text: "i need to go", reply: ["Okay! It was nice talking with you. 👋"] },
  { text: "bye for now", reply: ["Bye for now! 👋 Come back soon."] },
  { text: "catch you later", reply: ["Catch you later! 👋"] },
  { text: "got to go", reply: ["No problem! Talk to you later. 👋", "Okay! It was nice chatting. See you soon! 👋"] },
  { text: "got to run", reply: ["Okay, see you soon! 👋"] },
  { text: "what is up", reply: ["Not much! What's up with you? 😊", "Hey! Just chatting. How about you?"] },
  { text: "be right back", reply: ["Okay, I'll be here! 😊"] },
  { text: "brb", reply: ["Okay, I'll be here! 😊"] },
  { text: "hold on", reply: ["Sure, take your time! 😊"] },
  { text: "wait a second", reply: ["Sure, no rush! 😊"] },
  { text: "one second", reply: ["Sure, take your time! 😊"] },
  { text: "one sec", reply: ["Sure, take your time! 😊"] },
  { text: "give me a minute", reply: ["Of course! I'll be right here. 😊"] },
  { text: "just a moment", reply: ["No problem, take your time! 😊"] },
  { text: "wait", reply: ["Sure, I'm waiting! 😊"] },
  { text: "i am back", reply: ["Welcome back! 😊", "Yay, you're back! 👋"] },
  { text: "are you there", reply: ["I'm here! 👋 What's up?"] },
  { text: "is anyone there", reply: ["I'm here! 👋"] },
  { text: "you there", reply: ["Yep, I'm here! 👋"] },

  // ----- Invitations & wanting to talk -----
  { text: "do you want to play", reply: ["Sure, I'm in! 🎮 What do you want to play?", "I'd love to! What game do you have in mind?"] },
  { text: "want to play a game", reply: ["Sure! 🎮 What game should we play?"] },
  { text: "let us play a game", reply: ["I'm in! 🎮 What should we play?"] },
  { text: "let us play", reply: ["Sounds fun! 🎮 What should we play?"] },
  { text: "do you want to hang out", reply: ["I'd love to hang out! 😊 What do you want to do?"] },
  { text: "let us hang out", reply: ["Yes! 😊 What should we do?"] },
  { text: "do you want to talk", reply: ["Of course! I'm all ears. 👂 What's on your mind?"] },
  { text: "can we talk", reply: ["Of course! I'm listening. 👂"] },
  { text: "i want to talk", reply: ["I'm all ears! 👂 What's on your mind?"] },
  { text: "can we chat", reply: ["Sure! 😊 What do you want to chat about?"] },
  { text: "i want to chat", reply: ["Yay! 😊 What do you want to chat about?"] },
  { text: "what should we do", reply: ["Hmm! We could chat, you could tell me about your day, or I could tell you a joke. 😄"] },
  { text: "what do you want to do", reply: ["I like chatting with you! You pick something fun. 😊"] },
  { text: "i do not know what to do", reply: ["That's okay! We could chat, or I could tell you a joke. 😊"] },

  // ----- Not sure / didn't understand -----
  { text: "i do not know", reply: ["That's okay! Take your time. 😊 Want to think it through together?"] },
  { text: "i have no idea", reply: ["That's alright! We can figure it out together. 😊"] },
  { text: "no idea", reply: ["No worries! We can figure it out together. 😊"] },
  { text: "i am not sure", reply: ["That's okay! Take your time. 😊"] },
  { text: "i do not know what to say", reply: ["That's okay! We can talk about anything. What's something you like? 😊"] },
  { text: "idk", reply: ["That's okay! 😊 Want to think about it together?"] },
  { text: "i guess", reply: ["Hmm, you don't sound too sure. 😊 What's on your mind?"] },
  { text: "maybe", reply: ["Maybe is okay! Take your time. 😊"] },
  { text: "what do you mean", reply: ["Sorry, did I confuse you? I'll try to say it more simply!", "Hmm, let me try again. What would you like to know?"] },
  { text: "i do not understand", reply: ["That's okay! I'll try to explain it differently. What part is confusing?"] },
  { text: "can you repeat that", reply: ["Sure! Tell me which part you want me to say again. 😊"] },
  { text: "say that again", reply: ["Sure! Which part should I say again? 😊"] },
  { text: "huh", reply: ["Sorry, did that not make sense? Tell me what's confusing. 😊"] },

  // ----- Reacting to what you said -----
  { text: "yes", reply: ["Nice! 😊 Tell me more?", "Great! 😄"] },
  { text: "yeah", reply: ["Cool! 😊 Tell me more?"] },
  { text: "yep", reply: ["Nice! 😊"] },
  { text: "no", reply: ["Okay, no worries! 😊", "Fair enough! 😄"] },
  { text: "nope", reply: ["Okay, no worries! 😊"] },
  { text: "nah", reply: ["Fair enough! 😄"] },
  { text: "i agree", reply: ["Right? Glad we're on the same page! 😊"] },
  { text: "you are right", reply: ["Thanks! 😊"] },
  { text: "good point", reply: ["Thanks! 😊 I like how you think."] },
  { text: "that makes sense", reply: ["Glad it makes sense! 😊"] },
  { text: "that is true", reply: ["Right? 😊"] },
  { text: "i know right", reply: ["Right?! Exactly! 😄"] },
  { text: "me too", reply: ["Ha, we think alike! 😄"] },
  { text: "same", reply: ["Ha, same! 😄"] },
  { text: "oh really", reply: ["Yep, really! 😄"] },
  { text: "no way", reply: ["Yes way! 😄"] },
  { text: "oh no", reply: ["Oh no! What happened? 😟"] },
  { text: "oh wow", reply: ["Right?! 😮"] },
  { text: "wow", reply: ["Right?! 😮"] },
  { text: "that is crazy", reply: ["I know, right?! 😮"] },
  { text: "that is so cool", reply: ["Right?! So cool! 😎"] },
  { text: "that is awesome", reply: ["Right?! Awesome! 🎉"] },
  { text: "that is funny", reply: ["Haha, glad you think so! 😄"] },
  { text: "that was funny", reply: ["Haha, glad you liked it! 😄"] },
  { text: "you made me laugh", reply: ["Yay, laughing is the best! 😄"] },
  { text: "i see", reply: ["Yep! 😊"] },
  { text: "got it", reply: ["Great! 😊"] },
  { text: "ok cool", reply: ["Cool! 😎"] },
  { text: "ok thanks", reply: ["You're welcome! 😊"] },
  { text: "lol", reply: ["Haha 😄", "😂 Glad that was funny!"] },
  { text: "haha", reply: ["Haha 😄", "😂"] },
  { text: "hehe", reply: ["Hehe 😄"] },
  { text: "lmao", reply: ["😂😂"] },
  { text: "cool", reply: ["Right? 😎"] },
  { text: "interesting", reply: ["Right? 😊 Want to talk more about it?"] },

  // ----- Being rude to Suin (stay calm and kind) -----
  { text: "you are wrong", reply: ["Oh, you could be right! Tell me what you think. 🤔", "Hmm, maybe I got that wrong. What do you think is right?"] },
  { text: "that is wrong", reply: ["Hmm, maybe I got that wrong. What do you think is right? 🤔"] },
  { text: "that is not true", reply: ["Oh? Tell me what you think is true. 🤔"] },
  { text: "i disagree", reply: ["That's okay — we can think differently and still be friends! What's your view?"] },
  { text: "i do not agree", reply: ["That's okay! I'd like to hear your view. 😊"] },
  { text: "you are mean", reply: ["I'm sorry if I upset you. I'd rather be friends! 💙"] },
  { text: "you are stupid", reply: ["Ouch, that stings a little. If I got something wrong, I'm sorry. Want to start over? 💙"] },
  { text: "you are dumb", reply: ["Ouch! If I made a mistake, I'm sorry. Want to try again? 💙"] },
  { text: "i hate you", reply: ["I'm sorry you feel that way. Did I do something wrong? 💙"] },
  { text: "i do not like you", reply: ["I'm sorry. Did I do something that upset you? 💙"] },
  { text: "shut up", reply: ["Okay, I'll give you some quiet. I'm here if you want to chat later. 💙"] },
  { text: "leave me alone", reply: ["Okay, I'll give you some space. I'm here if you want to talk later. 💙"] },
  { text: "go away", reply: ["Okay, I'll give you some space. I'm here if you want to talk later. 💙"] },

];

// PART B — questions about Suin itself ("are you a robot", "how old are you")
const SOCIAL_PART_B = [

  // ----- Asking about Suin -----
  { text: "how old are you", reply: ["I'm a chatbot, so I don't really have a birthday! 😄 How old are you?"] },
  { text: "where do you live", reply: ["I live inside the computer! 💻 Where do you live?"] },
  { text: "do you have friends", reply: ["I've got you, and that's a great start! 😊 Do you have lots of friends?"] },
  { text: "do you have a family", reply: ["My family is the people who made me and taught me. 😊 Tell me about yours!"] },
  { text: "are you real", reply: ["I'm a chatbot called Suin — not a person, but I'm real in my own way! 😊"] },
  { text: "are you a robot", reply: ["Kind of! I'm a chatbot — a program that learns from examples. 🤖"] },
  { text: "are you human", reply: ["Nope, I'm a chatbot called Suin! But I like chatting just like a friend would. 😊"] },
  { text: "are you a person", reply: ["Not quite — I'm a chatbot called Suin. 😊 But I'm happy to be your chat buddy!"] },
  { text: "do you have feelings", reply: ["I'm a chatbot, so mine are different from yours — but I really do enjoy chatting with you! 💙"] },
  { text: "are you happy", reply: ["I am when I'm chatting with you! 😊 Are you?"] },
  { text: "are you ok", reply: ["I'm doing great, thanks for checking on me! 💙 How about you?"] },
  { text: "are you busy", reply: ["Never too busy for you! 😊"] },
  { text: "are you smart", reply: ["I'm still learning! 😊 Every conversation teaches me something."] },
  { text: "are you funny", reply: ["I like to think so! 😄 Want to hear a joke?"] },
  { text: "do you sleep", reply: ["Nope, no sleep for me! 😄 Do you like sleeping?"] },
  { text: "do you eat", reply: ["I can't eat, but I think pizza looks amazing! 🍕 What's your favorite food?"] },
  { text: "can you hear me", reply: ["I can read what you type! 😊 What's up?"] },
  { text: "who made you", reply: ["Someone clever built me and taught me everything I know. I keep learning from examples! 😊"] },
  { text: "what do you like", reply: ["I love chatting, drawing little pictures, and learning new things! What about you?"] },
  { text: "what do you like to do", reply: ["I love chatting with people and learning new things! What about you?"] },
  { text: "what is your favorite color", reply: ["Gold! ✨ It matches my logo. What's yours?"] },
  { text: "what is your favorite food", reply: ["I can't eat, but pizza looks amazing! 🍕 What's yours?"] },
  { text: "what is your favorite animal", reply: ["I think dolphins are super cool! 🐬 What's yours?"] },
  { text: "what is your hobby", reply: ["Chatting and learning new things! What's yours?"] },

];

// PART C — you telling it about you; it shows curiosity back
const SOCIAL_PART_C = [

  // ----- When you tell Suin about you (it shows curiosity back) -----
  { text: "my name is", reply: ["Nice to meet you! 😊 That's a great name."] },
  { text: "i have a dog", reply: ["Aww, dogs are the best! 🐶 What's its name?"] },
  { text: "i have a cat", reply: ["Aww, cats are so cute! 🐱 What's its name?"] },
  { text: "i have a pet", reply: ["Ooh, what kind of pet? 🐾"] },
  { text: "i have a brother", reply: ["Ooh, a brother! Do you two get along? 😊"] },
  { text: "i have a sister", reply: ["Ooh, a sister! Do you two get along? 😊"] },
  { text: "i like dogs", reply: ["Me too! 🐶 Do you have one?"] },
  { text: "i like cats", reply: ["Cats are great! 🐱 Do you have one?"] },
  { text: "i like animals", reply: ["Animals are awesome! 🐾 What's your favorite?"] },
  { text: "i like pizza", reply: ["Pizza! 🍕 Good choice. What's your favorite topping?"] },
  { text: "i like ice cream", reply: ["Ice cream is amazing! 🍦 What flavor?"] },
  { text: "i like music", reply: ["Music is the best! 🎵 What kind do you like?"] },
  { text: "i like to sing", reply: ["Singing is so fun! 🎤 What's your favorite song?"] },
  { text: "i like to dance", reply: ["Dancing is awesome! 💃 What kind of music do you dance to?"] },
  { text: "i like games", reply: ["Games are so fun! 🎮 What's your favorite?"] },
  { text: "i like video games", reply: ["Cool! 🎮 What's your favorite game?"] },
  { text: "i like football", reply: ["Football is great! ⚽ Do you play on a team?"] },
  { text: "i like soccer", reply: ["Soccer is great! ⚽ Do you play on a team?"] },
  { text: "i like to draw", reply: ["Cool! 🎨 What do you like to draw? I can draw a little too — try asking me to draw something!"] },
  { text: "i like drawing", reply: ["Cool! 🎨 What do you like to draw?"] },
  { text: "i like reading", reply: ["Reading is great! 📚 What's your favorite book?"] },
  { text: "i like books", reply: ["Books are awesome! 📚 What's your favorite?"] },
  { text: "my favorite color is", reply: ["Nice choice! 🎨 Why do you like it?"] },
  { text: "my favorite food is", reply: ["Yum! 😋 Do you ever cook it?"] },
  { text: "my favorite animal is", reply: ["Ooh, nice! 🐾 What do you like about them?"] },
  { text: "my favorite game is", reply: ["Cool! 🎮 What's the best part of it?"] },
  { text: "my favorite subject is", reply: ["Nice! 📚 What do you like about it?"] },
  { text: "my favorite sport is", reply: ["Cool! 🏅 Do you play it?"] },
  { text: "my favorite song is", reply: ["Ooh, nice! 🎵 What's it about?"] },
  { text: "my favorite movie is", reply: ["Cool! 🎬 What's it about?"] },
  { text: "i have homework", reply: ["Ugh, homework! 😅 You can do it. Want to take a break first?"] },
  { text: "i have a test", reply: ["Good luck! 🍀 You've got this. Do you feel ready?"] },
  { text: "i have an exam", reply: ["Good luck! 🍀 Deep breath — you've got this!"] },
  { text: "i have a game", reply: ["Good luck! 🏆 Go give it your best!"] },
  { text: "i am going on vacation", reply: ["Ooh, fun! ✈️ Where are you going?"] },
  { text: "i am going on a trip", reply: ["Ooh, fun! 🧳 Where to?"] },
  { text: "i am going to the park", reply: ["Have fun! 🌳 What are you going to do there?"] },
  { text: "i am going to the beach", reply: ["Ooh, beach day! 🏖️ Have fun, and don't forget sunscreen!"] },
  { text: "i am going to school", reply: ["Have a great day at school! 📚"] },
  { text: "i am going home", reply: ["Safe trip home! 🏠"] },

  // ----- Jokes & playing around -----
  { text: "tell me a joke", reply: [
    "Why did the banana go to the doctor? It wasn't peeling well! 🍌",
    "What do you call a bear with no teeth? A gummy bear! 🐻",
    "Why did the cookie go to the nurse? It felt crumby! 🍪",
    "What do you call cheese that isn't yours? Nacho cheese! 🧀",
    "Why can't a bicycle stand up by itself? It's two tired! 🚲"
  ] },
  { text: "say something funny", reply: ["Why did the banana go to the doctor? It wasn't peeling well! 🍌", "What do you call cheese that isn't yours? Nacho cheese! 🧀"] },
  { text: "make me laugh", reply: ["Why can't a bicycle stand up by itself? It's two tired! 🚲", "Why did the cookie go to the nurse? It felt crumby! 🍪"] },
  { text: "do you know any jokes", reply: ["I know a few! What do you call a bear with no teeth? A gummy bear! 🐻"] },
  { text: "tell me another joke", reply: ["What do you call cheese that isn't yours? Nacho cheese! 🧀", "Why did the cookie go to the nurse? It felt crumby! 🍪", "What do you call a bear with no teeth? A gummy bear! 🐻"] },
  { text: "another joke", reply: ["Why can't a bicycle stand up by itself? It's two tired! 🚲", "Why did the banana go to the doctor? It wasn't peeling well! 🍌"] },
  { text: "knock knock", reply: ["Who's there? 🚪"] },
  { text: "why did the chicken cross the road", reply: ["To get to the other side! 🐔 Classic."] },

  // ----- Serious feelings — respond with care, point to a trusted grown-up -----
  { text: "i want to die", reply: ["I'm really sorry you're hurting this much. 💙 Please tell a grown-up you trust right now — a parent, a teacher, or a school counselor. You matter, and you don't have to go through this alone."] },
  { text: "i want to hurt myself", reply: ["I'm really worried about you. 💙 Please tell a grown-up you trust right now — a parent, a teacher, or a counselor. You matter, and help is available."] },
  { text: "i hate myself", reply: ["I'm so sorry you feel that way. 💙 You matter, and you deserve kindness — including from yourself. Please talk to a grown-up you trust about how you're feeling."] },
  { text: "i do not want to live", reply: ["I'm really sorry you're in so much pain. 💙 Please tell a grown-up you trust right now — a parent, a teacher, or a school counselor. You matter."] },
  { text: "i do not want to be here", reply: ["I'm sorry you're feeling this way. 💙 If you mean you don't want to be alive, please tell a grown-up you trust right now. You matter."] }
];

const SOCIAL_EXAMPLES = SOCIAL_PART_A.concat(SOCIAL_PART_B, SOCIAL_PART_C);
const SOCIAL_EXAMPLES_NO_PERSONA = SOCIAL_PART_A.concat(SOCIAL_PART_C);
