// SoulSync Game Prompts and Questions Database

// Helper to shuffle arrays
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -------------------------------------------------------------
// GAME 1: SAME BRAIN (200+ Prompts)
// -------------------------------------------------------------
const baseSameBrainNouns = [
  "fruit", "color", "anime", "superhero", "dessert", "city", "pet", "movie", "drink", "country",
  "game", "Pokémon", "fast food chain", "Disney character", "holiday destination", "board game", "car brand", "music genre", "actor", "actress",
  "historical figure", "season of the year", "month", "day of the week", "card game", "flower", "vegetable", "school subject", "sport", "instrument",
  "clothing brand", "shoe brand", "pizza topping", "ice cream flavor", "social media app", "programming language", "constellation", "planet", "dinosaur", "ocean",
  "greek god", "hair color", "eye color", "accessory", "tech brand", "streamer/Youtuber", "cereal brand", "candy", "cookie brand", "pasta shape",
  "emoji", "cartoon show", "sitcom", "horror movie", "fantasy novel", "superpower", "musical", "video game console", "Harry Potter house", "avenger",
  "studio ghibli movie", "flavor of potato chips", "type of bread", "cooking ingredient", "breakfast food", "midnight snack", "zoo animal", "sea creature", "bird", "reptile",
  "mythical creature", "board game", "website", "streaming service", "phone app", "scent", "candle flavor", "coffee order", "tea flavor", "soda",
  "juice", "cocktail", "soup", "cheese type", "spice", "herb", "restaurant", "store in a mall", "subject to talk about", "hobby",
  "chore", "outdoor activity", "indoor activity", "board game", "card game", "party game", "instrument", "language", "accent", "hair style",
  "fashion style", "makeup item", "perfume scent", "flower type", "tree type", "weather type", "disaster", "gemstone", "metal", "fabric",
  "color shade", "sound", "smell", "feeling", "mood", "room in a house", "furniture item", "kitchen appliance", "bathroom item", "toy",
  "superhero group", "villain", "sidekick", "weapon", "shield", "spell", "magic item", "sci-fi tech", "spacecraft", "alien species",
  "robot", "time travel destination", "historical era", "mythology", "constellation", "star name", "galaxy", "mountain range", "river", "lake",
  "island", "desert", "country capital", "currency", "language", "slang word", "meme", "viral video", "celebrity couple", "fashion icon",
  "band", "solo artist", "song", "album", "music video", "concert venue", "festival", "dance style", "painting", "sculpture",
  "art style", "museum", "book genre", "classic novel", "comic book", "graphic novel", "podcast", "newspaper", "magazine", "blog",
  "school memory", "subject teacher", "lunch food", "playground game", "classroom item", "office supply", "job profession", "dream job", "side hustle", "business idea",
  "startup company", "invention", "app idea", "gadget", "smart home device", "wearable tech", "fitness exercise", "yoga pose", "workout routine", "sports team",
  "athlete", "stadium", "sports equipment", "hiking trail", "national park", "camping gear", "travel essential", "souvenir", "airport code", "flight airline",
  "hotel chain", "road trip snack", "driving song", "license plate state", "landmark", "tourist trap", "bucket list item", "childhood toy", "childhood game", "cartoon character",
  "bedtime story", "lullaby", "fairy tale", "nursery rhyme", "school field trip", "science experiment", "art project", "diy project", "craft tool", "drawing medium"
];

export const sameBrainPrompts = baseSameBrainNouns.map(noun => {
  // Capitalize first letter or custom adjustments
  const article = ["a", "e", "i", "o", "u", "h"].includes(noun[0].toLowerCase()) ? "an" : "a";
  return `Name ${article} ${noun}.`;
});

// -------------------------------------------------------------
// GAME 2: WOULD YOU RATHER (300+ Questions)
// -------------------------------------------------------------
const baseWyrQuestions = [
  // Travel & Adventure
  { text: "Would you rather travel to Japan or travel to Switzerland?", cat: "travel" },
  { text: "Would you rather live in a cozy cabin in the snowy mountains or a beach house on a tropical island?", cat: "travel" },
  { text: "Would you rather explore the deep ocean or outer space?", cat: "travel" },
  { text: "Would you rather go on a luxury cruise or a rugged backpacking trip?", cat: "travel" },
  { text: "Would you rather travel back in time to the 1920s or forward to the year 3000?", cat: "travel" },
  { text: "Would you rather visit a bustling neon-lit mega city or a quiet ancient temple town?", cat: "travel" },
  { text: "Would you rather camp under the Northern Lights or watch a sunset over the Grand Canyon?", cat: "travel" },
  { text: "Would you rather road trip across America or take a train ride across Europe?", cat: "travel" },
  { text: "Would you rather swim with dolphins or skydive from a helicopter?", cat: "travel" },
  { text: "Would you rather stay in a 5-star hotel or a quirky treehouse?", cat: "travel" },

  // Food & Drink
  { text: "Would you rather eat pizza for every meal or sushi for every meal?", cat: "food" },
  { text: "Would you rather only drink coffee for the rest of your life or only drink tea?", cat: "food" },
  { text: "Would you rather lose the ability to eat sweet food or savory food?", cat: "food" },
  { text: "Would you rather eat a meal cooked by a Michelin-star chef or cook a cozy meal together at home?", cat: "food" },
  { text: "Would you rather eat food that is too spicy or food that is too salty?", cat: "food" },
  { text: "Would you rather have chocolate-flavored potatoes or potato-flavored chocolate?", cat: "food" },
  { text: "Would you rather cook the meal but have to wash all the dishes, or do no cooking but wash them all?", cat: "food" },
  { text: "Would you rather eat only cold food for a year or only hot food for a year?", cat: "food" },
  { text: "Would you rather have access to unlimited tacos or unlimited burgers?", cat: "food" },
  { text: "Would you rather eat a dessert that is ice cold or a dessert that is freshly baked and warm?", cat: "food" },

  // Anime & Gaming
  { text: "Would you rather live in the Naruto universe or the One Piece universe?", cat: "anime" },
  { text: "Would you rather have a Death Note or a future-predicting diary?", cat: "anime" },
  { text: "Would you rather have Goku's physical strength or Lelouch's Geass power?", cat: "anime" },
  { text: "Would you rather be a student at UA High (My Hero Academia) or Hogwarts (Harry Potter)?", cat: "anime" },
  { text: "Would you rather fight alongside Demon Slayers or be a Jujutsu Sorcerer?", cat: "anime" },
  { text: "Would you rather play video games together all weekend or binge-watch anime series?", cat: "anime" },
  { text: "Would you rather live inside Minecraft or inside Animal Crossing?", cat: "anime" },
  { text: "Would you rather have your own custom Gundam or your own rideable dragon?", cat: "anime" },
  { text: "Would you rather be a legendary swordfighter or a powerful spellcaster?", cat: "anime" },
  { text: "Would you rather control fire or control water/ice?", cat: "anime" },

  // Romantic & Relationship
  { text: "Would you rather have a partner who is extremely funny or extremely smart?", cat: "romantic" },
  { text: "Would you rather hold hands in public all the time or get secret forehead kisses?", cat: "romantic" },
  { text: "Would you rather celebrate every tiny anniversary or only the major ones?", cat: "romantic" },
  { text: "Would you rather write a love letter or receive a surprise voice message?", cat: "romantic" },
  { text: "Would you rather have a cozy movie night at home or a fancy dinner date in a restaurant?", cat: "romantic" },
  { text: "Would you rather match outfits in public or have matching custom phone wallpapers?", cat: "romantic" },
  { text: "Would you rather wake up early to make breakfast for your partner or sleep in together?", cat: "romantic" },
  { text: "Would you rather travel together forever on a budget or stay in one luxury home together?", cat: "romantic" },
  { text: "Would you rather have your partner read your mind or always say exactly what they feel?", cat: "romantic" },
  { text: "Would you rather share a sleeping bag in a tent or share a king-sized bed in a resort?", cat: "romantic" }
];

// Dynamically generate the remaining 260+ questions using combinations to hit 300+
// Let's create an action / activity set and construct would you rather pairs dynamically.
const activities = [
  "read a book", "watch a horror movie", "play a puzzle game", "go for a jog", "cook a new recipe",
  "sing karaoke", "go stargazing", "learn a new language", "learn to play an instrument", "do a DIY craft",
  "visit a museum", "go to an amusement park", "listen to a podcast", "take a nap", "draw a picture",
  "write a story", "do a jigsaw puzzle", "clean the house", "shop online", "go window shopping",
  "eat spicy ramen", "drink hot chocolate", "walk in the rain", "swim in a lake", "hike up a hill",
  "ride a bicycle", "watch a comedy show", "meditate", "take a bubble bath", "take photos of nature",
  "make a scrapbook", "watch Youtube videos", "scroll TikTok", "play chess", "play a card game",
  "bake cookies", "make sushi", "plant a garden", "visit a zoo", "visit an aquarium",
  "build a blanket fort", "have a picnic", "watch the sunrise", "watch the sunset", "explore a cave",
  "go to a concert", "go to a theater play", "play a sport", "go bowling", "go ice skating"
];

const timeframes = [
  "on a rainy Sunday afternoon",
  "at 2:00 AM on a Friday night",
  "during a power outage",
  "on the first day of vacation",
  "on a cozy winter evening",
  "early in the morning before sunrise",
  "on a super hot summer afternoon",
  "during a long flight",
  "right after a stressful day",
  "while eating your favorite snack"
];

// Let's build a set of generated WYRs
const generatedWyrs = [];
let actIndex = 0;
let timeIndex = 0;

while (generatedWyrs.length < 270) {
  const act1 = activities[actIndex % activities.length];
  const act2 = activities[(actIndex + 17) % activities.length];
  const time = timeframes[timeIndex % timeframes.length];

  if (act1 !== act2) {
    generatedWyrs.push({
      text: `Would you rather ${act1} or ${act2} ${time}?`,
      cat: "random"
    });
  }
  actIndex++;
  timeIndex++;
}

export const wouldYouRatherQuestions = [...baseWyrQuestions, ...generatedWyrs];

// -------------------------------------------------------------
// GAME 4: WHO KNOWS ME BETTER (250+ Questions)
// -------------------------------------------------------------
const baseWymbQuestions = [
  "What is my absolute favorite color?",
  "What is my go-to comfort food?",
  "What is my favorite anime of all time?",
  "What is my dream travel destination?",
  "Am I a morning person or a night owl?",
  "What is my biggest pet peeve?",
  "What is my favorite season of the year?",
  "What is my favorite movie genre?",
  "What would be my superpower of choice?",
  "Am I more introverted or extroverted?",
  "What is my favorite dessert?",
  "What is my biggest fear?",
  "What was my favorite subject in school?",
  "If I could only eat one cuisine for the rest of my life, what would it be?",
  "Do I prefer coffee, tea, or soda?",
  "What is my favorite animal?",
  "Would I rather live in the city, countryside, or by the beach?",
  "What is my favorite holiday?",
  "What is my current favorite song or artist?",
  "How do I usually react when I'm stressed?",
  "What is my favorite childhood memory?",
  "Am I more of a saver or a spender?",
  "What is my favorite board game or card game?",
  "What is my shoe size?",
  "What is my favorite pizza topping?",
  "If I were an animal, what animal would I be?",
  "What is my dream job?",
  "Am I neat and organized or messy and chaotic?",
  "What is the first thing I do when I wake up?",
  "What is my favorite book or manga?"
];

// Add procedural questions to reach 250+
const wymbCategories = [
  "hobby", "movie", "song", "actor", "game", "snack", "drink", "emoji", "clothing item",
  "scent", "weather", "dinosaur", "Pokémon", "Disney movie", "holiday memory", "childhood toy",
  "school memory", "place in the house", "chore to hate", "superhero", "villain", "time of day",
  "car", "restaurant", "store", "gadget", "brand", "historical era", "actor/actress",
  "fruit", "ice cream flavor", "pizza parlor", "breakfast dish", "midnight snack", "cereal"
];

const wymbTemplates = [
  "What is my favorite [item]?",
  "What is my least favorite [item]?",
  "What was my first [item]?",
  "If I could buy any [item] right now, what would it be?",
  "What [item] do I use the most?",
  "If I had to get rid of one [item], what would it be?",
  "What is my dream [item]?"
];

const generatedWymb = [];
for (const template of wymbTemplates) {
  for (const item of wymbCategories) {
    const question = template.replace("[item]", item);
    if (!baseWymbQuestions.includes(question)) {
      generatedWymb.push(question);
    }
  }
}
const finalWymb = shuffleArray(generatedWymb).slice(0, 225);

export const whoKnowsMeBetterQuestions = [...baseWymbQuestions, ...finalWymb];

// -------------------------------------------------------------
// GAME 6: TRUTH OR DARE (500+ Prompts)
// -------------------------------------------------------------
const baseTruths = {
  Funny: [
    "What is the most embarrassing thing you've done in public?",
    "Have you ever walked into a wall or glass door?",
    "What is the weirdest habit you have when you are alone?",
    "What is the worst haircut you ever had?",
    "If you could only eat one food for the rest of your life, what would it be?",
    "Have you ever laughed at a completely inappropriate moment?",
    "What is the silliest lie you ever told your parents?",
    "What is your funniest childhood nickname?",
    "Have you ever texted the wrong person something private?",
    "What is the weirdest search in your browser history?"
  ],
  Cute: [
    "What is your first memory of me?",
    "What is your favorite nickname that I call you?",
    "What is something small I do that makes you happy?",
    "If you could buy me any gift right now, what would it be?",
    "What emoji reminds you of me?",
    "What is your favorite memory of us together?",
    "What is a cute habit you noticed about me?",
    "Which anime character do you think I am most like?",
    "What is the sweetest thing anyone has ever done for you?",
    "What makes you smile instantly?"
  ],
  Romantic: [
    "When did you realize you really liked me?",
    "What is your idea of the perfect date night?",
    "What is your favorite physical feature of mine?",
    "If we had a whole day together with no responsibilities, what would we do?",
    "What is a love song that makes you think of me?",
    "Do you believe in love at first sight, or love that grows over time?",
    "What is your favorite way to receive affection?",
    "If we could teleport anywhere in the world right now, where would we go?",
    "What does a happy future together look like to you?",
    "What is the most romantic movie you've ever seen?"
  ],
  Deep: [
    "What is a fear you have that you rarely talk about?",
    "What is a life lesson you had to learn the hard way?",
    "If you could change one thing about your past, would you?",
    "What are you most grateful for in your life right now?",
    "What is a dream you've given up on, or one you're still chasing?",
    "How do you want to be remembered by the people you love?",
    "What is something you are struggling with right now?",
    "Who has had the biggest impact on the person you've become?",
    "What does 'home' mean to you?",
    "What is the hardest decision you've ever had to make?"
  ],
  Anime: [
    "If you were transported to an anime world, which role would you want: protagonist, rival, or mentor?",
    "Who is your ultimate anime crush?",
    "What anime power would you choose to have in real life?",
    "What anime scene made you cry the most?",
    "If your life was an anime, what would the opening theme song be?",
    "Which anime villain do you secretly sympathize with?",
    "Would you rather have a Pokeball that works on real animals, or a rideable Nimbus cloud?",
    "What is your favorite anime arc of all time?",
    "Which anime studio should animate your life story?",
    "If you could spend a day with any anime character, who would it be?"
  ]
};

const baseDares = {
  Funny: [
    "Do your funniest face and hold it for 10 seconds.",
    "Speak in a funny accent for the next two rounds.",
    "Do your best impression of a chicken laying an egg.",
    "Try to lick your elbow.",
    "Balance a spoon on your nose for 10 seconds.",
    "Show me the most embarrassing picture on your phone.",
    "Spin in a circle 5 times and try to walk in a straight line.",
    "Dance like a robot for 20 seconds.",
    "Read the last 3 text messages you received out loud.",
    "Talk to a stuffed animal/pillow as if it's your boss."
  ],
  Cute: [
    "Send a heart emoji in the chat right now.",
    "Blow a kiss to the screen.",
    "Wink at the camera or send a cute selfie.",
    "Say 'I appreciate you' in the sweetest voice possible.",
    "Draw a tiny smiley face on your hand and show it.",
    "Compliment me in three different languages (or accents).",
    "Do a cute anime pose.",
    "Sing the chorus of a sweet song.",
    "Tell me three things you love about my personality.",
    "Make a heart shape with your hands and hold it."
  ],
  Romantic: [
    "Describe your favorite kiss in detail.",
    "Say something romantic in a whisper.",
    "Write a short 2-line love poem for me right now.",
    "Close your eyes and describe my face in detail.",
    "Tell me a secret fantasy you have.",
    "Propose to me using a random object in your room as a ring.",
    "Sing one line of our favorite song.",
    "Give a 30-second speech on why we make a great team.",
    "Send a voice note saying something sweet.",
    "Describe our future dream house together."
  ],
  Deep: [
    "Share a secret you've never told anyone else in this room.",
    "Stare into the screen/camera in silence for 15 seconds without laughing.",
    "Tell me something you think I should improve on, in a loving way.",
    "Share a moment when you felt truly vulnerable.",
    "Tell me what I mean to you in one honest paragraph.",
    "Explain a belief you hold that most people disagree with.",
    "Share a childhood insecurity you've managed to overcome.",
    "Name one thing you want us to accomplish together this year.",
    "Describe the biggest risk you've ever taken.",
    "Share what you think is your best quality as a partner."
  ],
  Anime: [
    "Say a classic anime line in your best dramatic voice (e.g., 'Omae wa mou shindeiru').",
    "Do a Naruto run across your room.",
    "Pose like a JoJo character and hold it.",
    "Sing one line of an anime opening theme song.",
    "Explain an anime plot badly in 15 seconds.",
    "Shout your 'signature move' name like a shonen anime protagonist.",
    "Do the Kamehameha wave pose.",
    "Say 'Onii-chan' or 'Senpai' in your best anime voice.",
    "Reenact a famous dramatic anime scene using a household object.",
    "Debate why your favorite anime character is the strongest in 20 seconds."
  ]
};

// We need 500+ prompts. Let's expand these lists procedurally by combining categories, items, and styles.
// We will generate 210+ truths and 210+ dares dynamically.
const categoriesList = ["Funny", "Cute", "Romantic", "Deep", "Anime"];
const truthTemplates = [
  "What is your honest opinion about [noun]?",
  "If you had to describe your relationship with [noun] in one word, what would it be?",
  "What is a secret dream you have about [noun]?",
  "When was the last time you felt jealous about [noun]?",
  "If you could ask [noun] any question and get an honest answer, what would it be?",
  "What is the most childish thing you still do involving [noun]?",
  "What is one thing you would change about [noun] if you could?",
  "What was your first impression when you saw [noun]?",
  "What is your favorite memory involving [noun]?",
  "Have you ever lied to [noun] about something small?"
];

const dareTemplates = [
  "Send a message to [noun] saying 'I love you' or something silly.",
  "Act like a [noun] for the next 30 seconds.",
  "Draw a quick picture of a [noun] and show it.",
  "Explain why [noun] is the best thing ever.",
  "Sing a song about a [noun].",
  "Do 5 pushups while shouting '[noun]!'",
  "Write a short story about [noun] in the chat.",
  "Find a [noun] in your room and treat it like a baby for 15 seconds.",
  "Make up a rap about [noun] on the spot.",
  "Balance a [noun] (or book) on your head for 10 seconds."
];

const nounsList = [
  "cats", "pizza", "our future", "anime characters", "marshmallows", "flying cars", "secret agents",
  "chocolate cookies", "space travel", "cute puppies", "dancing penguins", "magic spells", "haunted houses",
  "video games", "pop music", "rainy days", "sushi", "spicy noodles", "bubble tea", "sleeping in",
  "road trips", "rollercoasters", "starry nights", "karaoke nights", "pillow fights", "fancy hotels",
  "crying at movies", "bad jokes", "weird emojis", "ugly sweaters", "superheroes", "time machines",
  "giant pandas", "iced coffee", "cooking disasters", "funny memes", "cuddling", "holding hands",
  "matching pajamas", "secret codes", "love letters", "bubble baths", "scary movies", "board games",
  "talking pillows", "teddy bears", "warm blankets", "marshmallow hats", "winking", "giggling"
];

// Let's populate the dynamic arrays to guarantee 250+ Truths and 250+ Dares
const truthData = { Funny: [...baseTruths.Funny], Cute: [...baseTruths.Cute], Romantic: [...baseTruths.Romantic], Deep: [...baseTruths.Deep], Anime: [...baseTruths.Anime] };
const dareData = { Funny: [...baseDares.Funny], Cute: [...baseDares.Cute], Romantic: [...baseDares.Romantic], Deep: [...baseDares.Deep], Anime: [...baseDares.Anime] };

// Generate Truths
const generatedTruths = [];
for (const template of truthTemplates) {
  for (const noun of nounsList) {
    const truth = template.replace("[noun]", noun);
    generatedTruths.push(truth);
  }
}
const finalTruths = shuffleArray(generatedTruths);
finalTruths.forEach((truth, idx) => {
  const category = categoriesList[idx % categoriesList.length];
  if (truthData[category].length < 60) {
    if (!truthData[category].includes(truth)) {
      truthData[category].push(truth);
    }
  }
});

// Generate Dares
const generatedDares = [];
for (const template of dareTemplates) {
  for (const noun of nounsList) {
    const dare = template.replace("[noun]", noun);
    generatedDares.push(dare);
  }
}
const finalDares = shuffleArray(generatedDares);
finalDares.forEach((dare, idx) => {
  const category = categoriesList[idx % categoriesList.length];
  if (dareData[category].length < 60) {
    if (!dareData[category].includes(dare)) {
      dareData[category].push(dare);
    }
  }
});

export const truthPrompts = truthData;
export const darePrompts = dareData;

// -------------------------------------------------------------
// GAME 8: LOVE BINGO (50+ Tasks for 5x5 board population)
// -------------------------------------------------------------
export const bingoTasks = [
  "Stayed up late together",
  "Watched anime together",
  "Shared funny memes",
  "Called each other today",
  "Used matching emojis",
  "Played games together",
  "Said 'Good Morning'",
  "Said 'Good Night'",
  "Made each other laugh",
  "Sent a voice note",
  "Cooked/ordered same food",
  "Wore matching colors",
  "Planned next travel trip",
  "Stared into eyes 10s",
  "Made a silly face",
  "Sent a surprise selfie",
  "Shared Spotify playlist",
  "Had a deep conversation",
  "Bought a gift for other",
  "Sent a heart emoji",
  "Told a terrible pun",
  "Remembered anniversary",
  "Created a secret handshake",
  "Watched a movie together",
  "Sent a sweet love note",
  "Dreamt about each other",
  "Checked in during busy day",
  "Had a breakfast date",
  "Shared childhood photo",
  "Helped solve a problem",
  "Sang a song together",
  "Talked for over an hour",
  "Sent a funny TikTok/Reel",
  "Shared a secret",
  "Made a coffee/tea for other",
  "Gave a random compliment",
  "Kissed the screen",
  "Sent matching stickers",
  "Laughed until tummy hurt",
  "Took a photo together",
  "Went on a walk 'together'",
  "Read same manga/book",
  "Made a wish together",
  "Danced silly in room",
  "Agreed on a big decision",
  "Supported other's dream",
  "Sent a morning reminder",
  "Shared a comfort song",
  "Counted down to game start",
  "Said 'I love you'"
];

// Helper to generate a 5x5 bingo grid for a player
export function generateBingoBoard() {
  const shuffled = shuffleArray(bingoTasks);
  // Pick first 24 tasks
  const grid = shuffled.slice(0, 24);
  // Insert a "FREE SPACE ❤️" in the exact center (index 12)
  grid.splice(12, 0, "FREE SPACE ❤️");
  return grid;
}
