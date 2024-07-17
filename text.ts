import readline from "readline";

import { ESCAPE_CODES } from "./consoleUtil";

interface Config {
  prompt: string;
  placeholder?: string;
  autocomplete?: boolean;
}

(() => {
  const config: Config = {
    prompt: "What is your name? ",
    placeholder: "Name",
    autocomplete: true,
  };

  let value = "";
  let cursor = 0;

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

      if (key.name === "return") {
        process.stdout.write("\n");
        process.stdout.write(`You entered: ${value}`);
        process.exit();
      }
      if (key.sequence === "\u0003") {
        process.exit();
      }
      let left = cursor === 0 ? valueCopy : valueCopy.slice(0, -cursor);
      let right = cursor === 0 ? "" : valueCopy.slice(-cursor);
      if (key.name === "tab") {
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
      process.stdout.write(value);
      if (value === "") {
        process.stdout.write(ESCAPE_CODES.styles.dim);
        process.stdout.write(config.placeholder ?? "");
        process.stdout.write(ESCAPE_CODES.styles.dimOff);
      }
      process.stdout.write("\n");
      process.stdout.write(ESCAPE_CODES.cursor.up(1));
      process.stdout.write(ESCAPE_CODES.cursor.right(config.prompt.length + value.length));
      process.stdout.write(cursor === 0 ? "" : ESCAPE_CODES.cursor.left(cursor));
      if (config.autocomplete && value === "") {
        process.stdout.write(ESCAPE_CODES.cursor.right(config.placeholder?.length ?? 0));
      }
    }
  );
})();
