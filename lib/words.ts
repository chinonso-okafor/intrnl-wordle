// Legacy word list - kept for fallback and initial seeding
// New system uses AnswerWord and ValidationWord models with in-memory Sets
export const VALID_WORDS = [
  "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN",
  "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE", "ALIVE",
  "ALLOW", "ALONE", "ALONG", "ALTER", "AMONG", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE",
  "APPLY", "ARENA", "ARGUE", "ARISE", "ARRAY", "ARROW", "ASIDE", "ASSET", "AVOID", "AWAKE",
  "AWARD", "AWARE", "BADLY", "BAKER", "BASES", "BASIC", "BEACH", "BEGAN", "BEGIN", "BEING",
  "BELOW", "BENCH", "BILLY", "BIRTH", "BLACK", "BLAME", "BLANK", "BLAST", "BLIND", "BLOCK",
  "BLOOD", "BLOOM", "BOARD", "BOAST", "BOBBY", "BOOST", "BOOTH", "BOUND",
  "BRAIN", "BRAND", "BRASS", "BRAVE", "BREAD", "BREAK", "BREED", "BRIEF", "BRING", "BROAD",
  "BROKE", "BROWN", "BRUSH", "BUDDY", "BUILD", "BUILT", "BUNCH", "BURST", "BUYER", "CABLE",
  "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHAOS", "CHARM", "CHART", "CHASE",
  "CHEAP", "CHECK", "CHEST", "CHIEF", "CHILD", "CHINA", "CHOSE", "CHUNK", "CIVIC", "CIVIL",
  "CLAIM", "CLASS", "CLEAN", "CLEAR", "CLICK", "CLIMB", "CLOCK", "CLOSE", "CLOUD", "COACH",
  "COAST", "COULD", "COUNT", "COUPE", "COURT", "COVER", "CRAFT", "CRASH", "CRAZY", "CREAM",
  "CRIME", "CROSS", "CROWD", "CROWN", "CRUDE", "CURVE", "CYCLE", "DAILY", "DANCE", "DATED",
  "DEALT", "DEATH", "DEBUT", "DELAY", "DEPTH", "DOING", "DOUBT", "DOZEN", "DRAFT", "DRAMA",
  "DRANK", "DRAWN", "DREAM", "DRESS", "DRILL", "DRINK", "DRIVE", "DROVE", "DYING", "EAGER",
  "EARLY", "EARTH", "EIGHT", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL",
  "ERROR", "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH", "FALSE", "FANCY",
  "FARGO", "FATAL", "FAULT", "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT", "FINAL",
  "FIRST", "FIXED", "FLASH", "FLEET", "FLOOR", "FLUID", "FOCUS", "FORCE", "FORTH", "FORTY",
  "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FROST", "FRUIT", "FULLY",
  "FUNNY", "GIANT", "GIVEN", "GLASS", "GLOBE", "GLORY", "GRACE",
  "GRADE", "GRAIN", "GRAND", "GRANT", "GRASS", "GRAVE", "GREAT", "GREEN", "GROSS", "GROUP",
  "GROWN", "GUARD", "GUESS", "GUEST", "GUIDE", "GUILT", "HAPPY", "HARRY", "HARSH", "HATCH",
  "HEART", "HEAVY", "HENCE", "HENRY", "HORSE", "HOTEL", "HOUSE", "HUMAN", "HURRY", "IMAGE",
  "INDEX", "INNER", "INPUT", "ISSUE", "JAPAN", "JIMMY", "JOINT", "JONES", "JUDGE", "KNOWN",
  "LABEL", "LARGE", "LASER", "LATER", "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE",
  "LEGAL", "LEMON", "LEVEL", "LIGHT", "LIMIT", "LINKS", "LIVES", "LOCAL", "LOOSE", "LOWER",
  "LUCKY", "LUNCH", "LYING", "MAGIC", "MAJOR", "MAKER", "MARCH", "MARIA", "MATCH", "MAYBE",
  "MAYOR", "MEANT", "MEDIA", "METAL", "MIGHT", "MINOR", "MINUS", "MIXED", "MODEL", "MONEY",
  "MONTH", "MORAL", "MOTOR", "MOUNT", "MOUSE", "MOUTH", "MOVED", "MOVIE", "MUSIC", "NEEDS",
  "NEVER", "NEWLY", "NIGHT", "NOISE", "NORTH", "NOTED", "NOVEL", "NURSE", "OCCUR", "OCEAN",
  "OFFER", "OFTEN", "ORDER", "ORGAN", "OTHER", "OUGHT", "OWNER", "PAPER", "PARTY",
  "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIANO", "PIECE", "PILOT", "PITCH", "PLACE",
  "PLAIN", "PLANE", "PLANT", "PLATE", "POINT", "POUND", "POWER", "PRESS", "PRICE", "PRIDE",
  "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF", "PROUD", "PROVE", "QUEEN", "QUICK", "QUIET",
  "QUITE", "RADIO", "RAISE", "RANGE", "RAPID", "RATIO", "REACH", "REACT", "READY", "REALM",
  "REBEL", "REFER", "RELAX", "RELAY", "REPAY", "REPLY", "RIDER", "RIDGE", "RIGHT", "RIGID",
  "RISKY", "RIVER", "ROBOT", "ROCKY", "ROMAN", "ROUGH", "ROUND", "ROYAL", "RURAL", "SCALE",
  "SCENE", "SCOPE", "SCORE", "SENSE", "SERVE", "SEVEN", "SHADE", "SHAKE", "SHALL", "SHAPE",
  "SHARE", "SHARP", "SHEET", "SHELF", "SHELL", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHOOT",
  "SHORT", "SHOWN", "SIDED", "SIGHT", "SINCE", "SIXTH", "SIXTY", "SIZED", "SKILL", "SLEEP",
  "SLIDE", "SMALL", "SMART", "SMILE", "SMITH", "SMOKE", "SNACK", "SNAKE", "SOLAR",
  "SOLID", "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE", "SPARE", "SPEAK", "SPEED", "SPEND",
  "SPENT", "SPLIT", "SPOKE", "SPORT", "SQUAD", "STACK", "STAFF", "STAGE", "STAKE", "STAND",
  "START", "STATE", "STEAM", "STEEL", "STEEP", "STEER", "STICK", "STILL", "STOCK",
  "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK", "STUDY", "STUFF", "STYLE",
  "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE", "TAXES", "TEACH", "TEAMS",
  "TEETH", "TERMS", "TERRY", "TEXAS", "THANK", "THEFT", "THEIR", "THEME", "THERE", "THESE",
  "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "THUMB", "TIGER",
  "TIGHT", "TIMER", "TIRED", "TITLE", "TODAY", "TOPIC", "TOTAL", "TOUCH", "TOUGH", "TOWER",
  "TRACK", "TRADE", "TRAIN", "TREAT", "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED", "TRIES",
  "TRUCK", "TRULY", "TRUNK", "TRUST", "TRUTH", "TWICE", "TWIST", "TYLER", "UNCLE", "UNDER",
  "UNDUE", "UNION", "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE", "USUAL", "VALUE",
  "VIDEO", "VIRUS", "VISIT", "VITAL", "VOCAL", "VOICE", "WASTE", "WATCH", "WATER", "WHEEL",
  "WHERE", "WHICH", "WHILE", "WHITE", "WHOLE", "WHOSE", "WOMAN", "WOMEN", "WORLD", "WORRY",
  "WORSE", "WORST", "WORTH", "WOULD", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOURS",
  "YOUTH"
];

// Use new validation system if available, fallback to legacy list
export async function isValidWord(word: string): Promise<boolean> {
  try {
    const { isValidWord: newIsValidWord } = await import("./validation-words");
    return newIsValidWord(word);
  } catch {
    // Fallback to legacy validation
    return VALID_WORDS.includes(word.toUpperCase());
  }
}

// Synchronous version for backward compatibility (uses legacy list)
export function isValidWordSync(word: string): boolean {
  return VALID_WORDS.includes(word.toUpperCase());
}
