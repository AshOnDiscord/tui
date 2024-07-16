import { ESCAPE_CODES, underline } from "./consoleUtil";

// type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

// DeepPartial is a bitch and ends up giving me (type | unknown)[] which ts hates
export type DoublePartial<T> = {
  [K in keyof T]?: Partial<T[K]>;
};

const clamp = (min: number, max: number, value: number): number => {
  return Math.max(min, Math.min(max, value));
};

export interface Option {
  text?: string;
  value: NonNullable<unknown>;
  color?: keyof typeof ESCAPE_CODES.fg;
}

export enum SelectionStyle {
  Color = "color",
  Underline = "underline",
  Bold = "bold",
  Italic = "italic",
}

export interface Config {
  selector: {
    color: keyof typeof ESCAPE_CODES.fg;
    indicator: string;
  };
  options: {
    padding: number;
    selectedStyles: SelectionStyle[];
    selectedColor: keyof typeof ESCAPE_CODES.fg;
  };
  defaultSelected: number;
  selectWrapping: boolean;
  keyBindings: {
    down: string[];
    up: string[];
    select: string[];
    exitKeys?: string[]; // We do not allow the user to remove the default exit keys, this is for extending the exit keys
  };
}

export default class Selector {
  public static defaultConfig: Config = {
    selector: {
      color: "blue",
      indicator: "❯",
    },
    options: {
      padding: 2,
      selectedStyles: [SelectionStyle.Underline],
      selectedColor: "blue",
    },
    defaultSelected: 0,
    selectWrapping: true,
    keyBindings: {
      down: ["\u001B\u005B\u0042"],
      up: ["\u001B\u005B\u0041"],
      select: ["\r"],
    },
  };
  private selectedOption: Option;
  private resolvePromise?: (value: unknown) => void;
  private config: Config;

  constructor(private options: Option[], config: DoublePartial<Config>) {
    this.config = {
      ...Selector.defaultConfig,
      ...config,
      selector: {
        // Nesting requires manual merging otherwise it will overwrite the entire object
        ...Selector.defaultConfig.selector,
        ...config.selector,
      },
      options: {
        ...Selector.defaultConfig.options,
        ...config.options,
      },
      keyBindings: {
        ...Selector.defaultConfig.keyBindings,
        ...config.keyBindings,
      },
    };

    this.selectedOption = options[this.config.defaultSelected];
  }

  #init() {
    this.printOptions(false);
  }

  #cleanUp() {
    process.stdout.write(ESCAPE_CODES.cursor.show);
    process.stdin.removeListener("data", this.#handleInput);
    process.stdin.pause();
    process.stdin.setRawMode(false);
    this.resolvePromise!(this.selectedOption);
  }

  #handleInput(rawKey: Buffer) {
    const key = rawKey.toString();

    // Raw mode is enabled, so we need to handle exit keys manually
    const EXIT_KEYS = [
      "\u0003", // Ctrl-C
      "\u0004", // Ctrl-D
      "\u001A", // Ctrl-Z
      "\u001C", // Ctrl-\
      "\u001D", // Ctrl-]
      ...(this.config.keyBindings.exitKeys ?? []),
    ];

    if (EXIT_KEYS.includes(key)) {
      this.#cleanUp();
      process.exit();
    }

    // Option Selected
    if (this.config.keyBindings.select.includes(key)) {
      this.#cleanUp();
    }

    let selectedChanged = false;

    // Update Selection
    let selectedIndex = this.options.indexOf(this.selectedOption);
    if (this.config.keyBindings.down.includes(key)) {
      selectedIndex++;
    } else if (this.config.keyBindings.up.includes(key)) {
      selectedIndex--;
    }

    if ([...this.config.keyBindings.down, ...this.config.keyBindings.up].includes(key)) {
      selectedChanged = true;
      if (!this.config.selectWrapping) {
        selectedIndex = clamp(0, this.options.length - 1, selectedIndex);
      } else {
        selectedIndex = (selectedIndex + this.options.length) % this.options.length;
      }
    }

    this.selectedOption = this.options[selectedIndex];

    if (selectedChanged) {
      this.printOptions();
    }
  }

  public async select() {
    this.#init();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdout.write(ESCAPE_CODES.cursor.hide);
    process.stdin.on("data", this.#handleInput.bind(this));
    await new Promise((resolve) => (this.resolvePromise = resolve));
    return this.selectedOption;
  }

  // clear = false is typically used to initialize the menu
  public static _printOptions(
    config: Config,
    options: Option[],
    selected: Option,
    clear: boolean = true
  ) {
    // console.clear();
    // instead of using console.clear(), move the cursor via ANSI escape codes and replace the content

    if (clear) {
      const optionLength = (
        options[options.length - 1].text ?? options[options.length - 1].value.toString()
      ).length;
      const lineLength = config.selector.indicator.length + config.options.padding + optionLength;
      process.stdout.write(ESCAPE_CODES.cursor.left(lineLength));
      process.stdout.write(ESCAPE_CODES.cursor.up(options.length));
    }
    options.forEach((option) => {
      const displayText = option.text ?? option.value.toString();

      if (option === selected) {
        if (selected.color) {
          process.stdout.write(ESCAPE_CODES.fg[config.selector.color]);
        }
        process.stdout.write(config.selector.indicator);
        process.stdout.write(ESCAPE_CODES.fg.default);
      } else {
        process.stdout.write(" ".repeat(config.selector.indicator.length));
      }
      process.stdout.write(" ".repeat(config.options.padding));
      if (option.color) process.stdout.write(ESCAPE_CODES.fg[option.color ?? "DEFAULT"]);
      if (option === selected) {
        for (const style of config.options.selectedStyles) {
          if (style === SelectionStyle.Color) {
            process.stdout.write(ESCAPE_CODES.fg[config.options.selectedColor]);
            continue;
          }
          process.stdout.write(ESCAPE_CODES.styles[style]);
        }
      }
      process.stdout.write(displayText);
      if (option === selected) {
        process.stdout.write(ESCAPE_CODES.reset);
      }
      process.stdout.write(ESCAPE_CODES.fg.default);
      process.stdout.write("\n");
    });
  }

  public printOptions(clear: boolean = true) {
    Selector._printOptions(this.config, this.options, this.selectedOption, clear);
  }
}
