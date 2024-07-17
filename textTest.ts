import { ESCAPE_CODES } from "./consoleUtil";
import TextInput, { type Config } from "./textInput";

const config: Config = {
  prompt: "What is your email? ",
  placeholder: "test@lol.com",
  autocomplete: true,
  autocompleteEndCursor: false,
  validator: (value: string) => {
    return {
      valid: value.includes("@"),
      message: value.includes("@")
        ? undefined
        : ESCAPE_CODES.fg.brightRed +
          "Please enter a valid email address" +
          ESCAPE_CODES.fg.default,
    };
  },
  liveValidation: true,
};

const textInput = new TextInput(config);
console.log("blah blah blah");
const input = await textInput.select();

console.log(`Input: ${input}`);
console.log("rah rah rah");
