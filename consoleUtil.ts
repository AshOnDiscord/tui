export const ESCAPE_CODES = {
  reset: "\x1b[0m",

  styles: {
    bold: "\x1b[1m",
    boldOff: "\x1b[22m",

    dim: "\x1b[2m",
    dimOff: "\x1b[22m",

    italic: "\x1b[3m",
    italicOff: "\x1b[23m",

    underline: "\x1b[4m",
    underlineOff: "\x1b[24m",

    inverse: "\x1b[7m",
    inverseOff: "\x1b[27m",

    hidden: "\x1b[8m",
    hiddenOff: "\x1b[28m",

    strikethrough: "\x1b[9m",
    strikethroughOff: "\x1b[29m",
  },

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    default: "\x1b[39m",

    brightBlack: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
  },

  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    default: "\x1b[49m",

    brightBlack: "\x1b[100m",
    brightRed: "\x1b[101m",
    brightGreen: "\x1b[102m",
    brightYellow: "\x1b[103m",
    brightBlue: "\x1b[104m",
    brightMagenta: "\x1b[105m",
    brightCyan: "\x1b[106m",
    brightWhite: "\x1b[107m",
  },

  cursor: {
    hide: "\x1b[?25l",
    show: "\x1b[?25h",

    up: (count: number = 1) => `\x1b[${count}A`,
    down: (count: number = 1) => `\x1b[${count}B`,

    left: (count: number = 1) => `\x1b[${count}D`,
    right: (count: number = 1) => `\x1b[${count}C`,
  },
};

export const underline = (string: string): string => {
  return `${ESCAPE_CODES.styles.underline}${string}${ESCAPE_CODES.styles.underlineOff}`;
};
