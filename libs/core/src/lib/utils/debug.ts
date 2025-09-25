export const Debug = {
  log: <T>(value: T, label?: string) => {
    if (label) {
      console.log(label, value);
    } else {
      console.log(value);
    }
    return value;
  },
};
