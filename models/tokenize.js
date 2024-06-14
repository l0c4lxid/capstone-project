const tokenize = (
  text,
  tokenizer,
  vocabSize = 5000,
  oovToken = "<OOV>",
  maxLength = 229
) => {
  text = text.toLowerCase();
  // text = text.replace(/[!"#$%()*+,-./:;<=>?@\[\\\]\^_`{|}~\t\n]/g, ""); // Hindari menghapus karakter khusus
  var split_text = text.split(" ");
  var tokens = [];
  split_text.forEach((element) => {
    if (tokenizer[element] !== undefined) {
      // gunakan '!=='
      if (tokenizer[element] < vocabSize) {
        tokens.push(tokenizer[element]);
      } else if (tokenizer[oovToken] !== undefined) {
        // gunakan '!=='
        tokens.push(tokenizer[oovToken]);
      }
    } else if (tokenizer[oovToken] !== undefined) {
      // gunakan '!=='
      tokens.push(tokenizer[oovToken]);
    }
  });
  while (tokens.length < maxLength) {
    // Ubah 'push(0)' menjadi 'push(0)'
    tokens.push(0);
  }
  return [tokens];
};

module.exports = { tokenize };
