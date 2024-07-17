import readline from "readline";

import { ESCAPE_CODES } from "./consoleUtil";

interface ValidatorResult {
  valid: boolean;
  message?: string;
}
type Validator = (value: string) => ValidatorResult;

interface Config {
  prompt: string;
  placeholder?: string;
  autocomplete?: boolean;
  validate?: Validator;
  liveValidation?: boolean;
}

(() => {
  const config: Config = {
    prompt: "What is your email? ",
    placeholder: "test@lol.com",
    autocomplete: true,
    validate: (value: string) => {
      return {
        valid: value.includes("@"),
        message:
          ESCAPE_CODES.fg.brightRed +
          "Please enter a valid email address" +
          ESCAPE_CODES.fg.default,
      };
    },
    liveValidation: false,
  };

  let value = "";
  let cursor = 0;
  let lastSubmission: ValidatorResult | undefined;

  readline.emitKeypressEvents(process.stdin);

  process.stdin.setRawMode(true);
  process.stdin.on(
    "keypress",
    (
      chunk: string,
      key: { sequence: string; name: string; ctrl: boolean; meta: boolean; shift: boolean }
    ) => {
      // console.clear();
      let valueCopy = value; // copy to detect changes (rerender)

      if (key.sequence === "\u0003") {
        process.exit();
      }

      let left = cursor === 0 ? valueCopy : valueCopy.slice(0, -cursor);
      let right = cursor === 0 ? "" : valueCopy.slice(-cursor);

      if (key.name === "return") {
        const validationResults = config.validate?.(value);
        lastSubmission = validationResults;
        if (validationResults?.valid) {
          process.stdout.write("\n");
          process.stdout.write(`You entered: ${value}`);
          process.exit(); // exit, any return past this point is if the value is invalid
        }
      } else if (key.name === "tab") {
        if (config.autocomplete) {
          valueCopy = config.placeholder ?? "";
        }
      } else if (key.name === "left") {
        cursor = Math.min(valueCopy.length, cursor + 1);
      } else if (key.name === "right") {
        cursor = Math.max(0, cursor - 1);
      } else if (key.name === "backspace") {
        valueCopy = left.slice(0, -1) + right;
      } else if (chunk?.length === 1) {
        valueCopy = left + chunk + right;
      }

      // Update left and right
      left = cursor === 0 ? valueCopy : valueCopy.slice(0, -cursor);
      right = cursor === 0 ? "" : valueCopy.slice(-cursor);

      // console.log(key, chunk);
      // console.log(valueCopy, value, cursor);
      if (valueCopy !== value) {
        value = valueCopy;
        // console.log("updated");
      }
      process.stdout.write("\x1b[G");
      process.stdout.write("\x1b[K");
      process.stdout.write(config.prompt);
      if (key.name === "return" && lastSubmission?.valid === false) {
        process.stdout.write(ESCAPE_CODES.fg.brightRed);
      }
      process.stdout.write(value);
      process.stdout.write(ESCAPE_CODES.fg.default);
      if (value === "") {
        process.stdout.write(ESCAPE_CODES.styles.dim);
        process.stdout.write(config.placeholder ?? "");
        process.stdout.write(ESCAPE_CODES.styles.dimOff);
      }
      process.stdout.write("\n");
      process.stdout.write("\x1b[K");
      if (config.liveValidation) {
        const validationResults = config.validate?.(value);
        process.stdout.write(validationResults?.valid ? "" : validationResults?.message ?? "");
      } else if (lastSubmission?.valid === false) {
        process.stdout.write(lastSubmission.message ?? "");
      }
      process.stdout.write(ESCAPE_CODES.cursor.up(1));
      process.stdout.write("\x1b[G");
      process.stdout.write(ESCAPE_CODES.cursor.right(config.prompt.length + value.length));
      process.stdout.write(cursor === 0 ? "" : ESCAPE_CODES.cursor.left(cursor));
      if (config.autocomplete && value === "") {
        process.stdout.write(ESCAPE_CODES.cursor.right(config.placeholder?.length ?? 0));
      }
    }
  );
})();

// red input, persist error msg
