import Selector, { type Option, type Config, SelectionStyle, type DeepPartial } from "./selector";

enum Size {
  SMALL,
  MEDIUM,
  LARGE,
}

const options: Option[] = [
  {
    text: "Small",
    value: Size.SMALL,
  },
  {
    text: "Medium",
    value: Size.MEDIUM,
  },
  {
    text: "Large",
    value: Size.LARGE,
  },
];

const config: DeepPartial<Config> = {
  options: {
    selectedStyles: [
      SelectionStyle.Bold,
      SelectionStyle.Underline,
      SelectionStyle.Color,
      SelectionStyle.Italic,
    ],
  },
};

const selector = new Selector(options, config);

console.log("blah blah blah");
const selected = await selector.select();
console.log("Selected:", selected);
