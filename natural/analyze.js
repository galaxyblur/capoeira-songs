import _ from 'lodash';
import natural from 'natural';

import { loadSongsFromFile } from '../lib/SongsHelper';

import {
  normalizeToken,
  StopWords,
  StopWordsEnglish,
  writeNGramsToFile,
  writeTokensToFile,
} from '../lib/NLPHelper';

const sortByCountFirst = (a, b) => {
  const aToken = a[0];
  const bToken = b[0];

  if (aToken === bToken) {
    return 0;
  }

  const aCount = a[1];
  const bCount = b[1];

  if (aCount === bCount) {
    return aToken < bToken ? -1 : 1;
  }

  return aCount < bCount ? -1 : 1;
};

loadSongsFromFile().then((songs) => {
  console.log(`Analyzing ${songs.length} songs.`);

  const tokenizer = new natural.AggressiveTokenizerPt();
  const NGrams = natural.NGrams;
  let allTokens = [];
  let allNGrams = [];
  let i;

  for (i = 0; i < songs.length; i++) {
    const s = songs[i];
    let text = s.text;

    StopWordsEnglish.forEach((w) => {
      text = text.replace(new RegExp(w, 'g'), '');
      text = text.replace(new RegExp(_.startCase(w), 'g'), '');
    });

    const tokens = tokenizer.tokenize(text);
    _.remove(tokens, t => StopWords.indexOf(normalizeToken(t)) >= 0);
    allTokens = allTokens.concat(_.uniqBy(tokens, normalizeToken));

    const ngrams = NGrams.ngrams(_.deburr(text), 4);
    const ngramsClean = ngrams.map(n => n.join(' ').toLowerCase());
    allNGrams = allNGrams.concat(_.uniq(ngramsClean));
  }

  const allTokensWithCount = _.toPairs(
    _.countBy(allTokens, normalizeToken)
  );

  const allTokensSorted = allTokensWithCount;
  allTokensSorted.sort(sortByCountFirst);

  console.log(allTokensSorted.reverse());
  writeTokensToFile(allTokensSorted);

  const allNGramsWithCount = _.toPairs(
    _.countBy(allNGrams, n => n)
  );

  const allNGramsSorted = allNGramsWithCount;
  allNGramsSorted.sort(sortByCountFirst);

  console.log(allNGramsSorted.reverse());
  writeNGramsToFile(allNGramsSorted);
});
