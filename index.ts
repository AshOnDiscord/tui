import { stdout } from "bun";

const ESCAPE_CODES = {
  RESET: "\x1b[0m",

  STYLES: {
    BOLD: "\x1b[1m",
    BOLD_OFF: "\x1b[22m",

    DIM: "\x1b[2m",
    DIM_OFF: "\x1b[22m",

    UNDERLINE: "\x1b[4m",
    UNDERLINE_OFF: "\x1b[24m",

    INVERSE: "\x1b[7m",
    INVERSE_OFF: "\x1b[27m",

    HIDDEN: "\x1b[8m",
    HIDDEN_OFF: "\x1b[28m",

    STRIKETHROUGH: "\x1b[9m",
    STRIKETHROUGH_OFF: "\x1b[29m",
  },

  FG: {
    BLACK: "\x1b[30m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
    CYAN: "\x1b[36m",
    WHITE: "\x1b[37m",
    DEFAULT: "\x1b[39m",

    BRIGHT_BLACK: "\x1b[90m",
    BRIGHT_RED: "\x1b[91m",
    BRIGHT_GREEN: "\x1b[92m",
    BRIGHT_YELLOW: "\x1b[93m",
    BRIGHT_BLUE: "\x1b[94m",
    BRIGHT_MAGENTA: "\x1b[95m",
    BRIGHT_CYAN: "\x1b[96m",
    BRIGHT_WHITE: "\x1b[97m",
  },

  BG: {
    BLACK: "\x1b[40m",
    RED: "\x1b[41m",
    GREEN: "\x1b[42m",
    YELLOW: "\x1b[43m",
    BLUE: "\x1b[44m",
    MAGENTA: "\x1b[45m",
    CYAN: "\x1b[46m",
    WHITE: "\x1b[47m",
    DEFAULT: "\x1b[49m",

    BRIGHT_BLACK: "\x1b[100m",
    BRIGHT_RED: "\x1b[101m",
    BRIGHT_GREEN: "\x1b[102m",
    BRIGHT_YELLOW: "\x1b[103m",
    BRIGHT_BLUE: "\x1b[104m",
    BRIGHT_MAGENTA: "\x1b[105m",
    BRIGHT_CYAN: "\x1b[106m",
    BRIGHT_WHITE: "\x1b[107m",
  },
};

// custom interactive cli select menu
const options: { text: string; color?: keyof typeof ESCAPE_CODES.FG }[] = [
  {
    text: "Small",
    color: "RED",
  },
  {
    text: "Medium",
    color: "GREEN",
  },
  {
    text: "Large",
    color: "BLUE",
  },
];
const selectorColor: keyof typeof ESCAPE_CODES.FG = "BLUE";
const selectIndicator: string = "❯";
const optionPadding = 2;
const optionWrapping = true;

const underline = (string: string): string => {
  return `${ESCAPE_CODES.STYLES.UNDERLINE}${string}${ESCAPE_CODES.STYLES.UNDERLINE_OFF}`;
};

let selectedOption = 0;

function printOptions() {
  console.clear();
  options.forEach((option, index) => {
    if (index === selectedOption) {
      if (selectorColor) {
        process.stdout.write(ESCAPE_CODES.FG[selectorColor]);
      }
      process.stdout.write(selectIndicator);
      process.stdout.write(ESCAPE_CODES.FG.DEFAULT);
    } else {
      process.stdout.write(" ".repeat(selectIndicator.length));
    }
    process.stdout.write(" ".repeat(optionPadding));
    if (option.color) process.stdout.write(ESCAPE_CODES.FG[option.color]);
    if (index === selectedOption) {
      process.stdout.write(underline(option.text));
    } else {
      process.stdout.write(option.text);
    }
    process.stdout.write(ESCAPE_CODES.FG.DEFAULT + "\n");
  });
}

printOptions();

const cursorDownKeys = ["\u001B\u005B\u0042"];
const cursorUpKeys = ["\u001B\u005B\u0041"];
const enterKeys = ["\r"];

// detect key press
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", function (keyRaw) {
  const key = keyRaw.toString();
  if (enterKeys.includes(key)) {
    // console.log(`You selected: ${options[selectedOption].text}`);
    process.stdout.write(`You selected: `);
    if (options[selectedOption].color) {
      process.stdout.write(ESCAPE_CODES.FG[options[selectedOption].color!]);
    }
    process.stdout.write(underline(options[selectedOption].text));
    process.stdout.write(ESCAPE_CODES.FG.DEFAULT);
    process.exit();
  }

  if (cursorUpKeys.includes(key)) {
    selectedOption--;
  } else if (cursorDownKeys.includes(key)) {
    selectedOption++;
  }
  if ([...cursorDownKeys, ...cursorUpKeys].includes(key)) {
    if (!optionWrapping) {
      selectedOption = Math.max(0, Math.min(selectedOption, options.length - 1));
    }
    if (optionWrapping) {
      selectedOption = (selectedOption + options.length) % options.length;
    }
  }
  printOptions();
});
