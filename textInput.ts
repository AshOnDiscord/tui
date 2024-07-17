import readline from "readline";

import { ESCAPE_CODES } from "./consoleUtil";

export interface ValidatorResult {
  valid: boolean;
  message?: string;
}
export type Validator = (value: string) => ValidatorResult;

export interface Config {
  prompt: string;
  placeholder?: string;
  autocomplete?: boolean;
  autocompleteEndCursor?: boolean;
  validator?: Validator;
  liveValidation?: boolean;
}

export default class TextInput {
  private value: string = "";
  private cursorOffset: number = 0;
  private lastValidation: ValidatorResult | undefined;
  private resolve: ((value: string) => void) | undefined;

  constructor(private config: Config) {}

  public async select() {
    this.#init();
    return await new Promise((resolve) => (this.resolve = resolve));
  }

  #init() {
    this.renderInput(this.value);
    this.updateCursor(this.cursorOffset);
    readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("keypress", this.#handleInput.bind(this)); // bind ctx as stdin.on changes ctx
  }

  #cleanUp(): void {
    process.stdout.write(ESCAPE_CODES.cursor.down(1));
    process.stdout.write(ESCAPE_CODES.cursor.start);
    process.stdout.write(ESCAPE_CODES.clearLine); // delete validation message

    process.stdin.off("keypress", this.#handleInput.bind(this));
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  #handleInput(
    chunk: string,
    key: { sequence: string; name: string; ctrl: boolean; meta: boolean; shift: boolean }
  ): void {
    if (key.sequence === "\u0003") {
      this.#cleanUp();
      process.exit();
    }
    let newValue = this.value;
    let newCursorOffset = this.cursorOffset;

    // grab left and right side of the cursor
    let left = this.cursorOffset === 0 ? this.value : this.value.slice(0, -this.cursorOffset);
    let right = this.cursorOffset === 0 ? "" : this.value.slice(-this.cursorOffset);

    switch (key.name) {
      case "return": {
        if (!this.config.validator) {
          this.#cleanUp();
          return this.resolve?.(this.value);
        }
        const validationResults = this.config.validator(this.value);
        this.lastValidation = validationResults;
        if (validationResults.valid) {
          this.#cleanUp();
          return this.resolve?.(this.value);
        }
        break;
      }
      case "tab": {
        if (!this.config.placeholder || !this.config.autocomplete) {
          break;
        }
        if (this.value === "") {
          newValue = this.config.placeholder;
          newCursorOffset = this.value.length;
          break;
        }
        break;
      }
      case "backspace": {
        if (newCursorOffset === newValue.length) {
          break;
        }
        newValue = left.slice(0, -1) + right;
        break;
      }
      case "left": {
        newCursorOffset = Math.min(newValue.length, newCursorOffset + 1);
        break;
      }
      case "right": {
        newCursorOffset = Math.max(0, newCursorOffset - 1);
        break;
      }
      default: {
        if (chunk.length === 1) {
          newValue = left + chunk + right;
        }
        break;
      }
    }

    if (this.config.liveValidation && this.config.validator) {
      this.lastValidation = this.config.validator(newValue);
    }

    let validationOccured = key.name === "return" || this.config.liveValidation;

    if (newValue !== this.value || validationOccured) {
      let invalid = validationOccured && this.lastValidation?.valid === false;

      this.resetLine();
      this.renderInput(newValue, invalid, this.lastValidation?.message);
      this.value = newValue;

      this.updateCursor(newCursorOffset);
    }
    if (newValue === this.value && newCursorOffset !== this.cursorOffset) {
      this.updateCursor(newCursorOffset);
    }
  }

  private resetLine() {
    process.stdout.write(ESCAPE_CODES.cursor.down(1));
    process.stdout.write(ESCAPE_CODES.cursor.start);
    process.stdout.write(ESCAPE_CODES.clearLine); // delete validation message

    process.stdout.write(ESCAPE_CODES.cursor.up(1));
    process.stdout.write(ESCAPE_CODES.clearLine);
    process.stdout.write(ESCAPE_CODES.cursor.start);
  }

  private renderInput(
    value: string = "",
    invalid: boolean = false,
    validationError: string | undefined = undefined
  ) {
    // prompt
    process.stdout.write(this.config.prompt);

    // value
    if (invalid) {
      process.stdout.write(ESCAPE_CODES.fg.brightRed);
    }
    process.stdout.write(value);
    process.stdout.write(ESCAPE_CODES.fg.default);

    // placeholder
    if (this.config.placeholder && value === "") {
      process.stdout.write(ESCAPE_CODES.styles.dim);
      process.stdout.write(this.config.placeholder);
      process.stdout.write(ESCAPE_CODES.styles.dimOff);
    }

    process.stdout.write("\n");

    // validation error
    if (validationError) {
      process.stdout.write(ESCAPE_CODES.fg.brightRed);
      process.stdout.write(validationError);
      process.stdout.write(ESCAPE_CODES.fg.default);
    }
  }

  private updateCursor(newCursorOffset: number) {
    process.stdout.write(ESCAPE_CODES.cursor.up(1));
    process.stdout.write(ESCAPE_CODES.cursor.start);
    const prevLineLength = this.config.prompt.length + this.value.length;
    process.stdout.write(ESCAPE_CODES.cursor.right(prevLineLength)); // to the very right;
    if (newCursorOffset !== 0) {
      process.stdout.write(ESCAPE_CODES.cursor.left(newCursorOffset));
    }
    if (
      this.config.placeholder &&
      this.config.autocomplete &&
      this.config.autocompleteEndCursor &&
      this.value === ""
    ) {
      process.stdout.write(ESCAPE_CODES.cursor.right(this.config.placeholder.length));
    }
    this.cursorOffset = newCursorOffset;
  }
}
