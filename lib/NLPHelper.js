import _ from 'lodash';
import fs from 'fs';
import path from 'path';

import StopWordsPT from 'stopwords-pt';

const tokensFilename = 'nlp-tokens.json';
const tokensFilePath = path.resolve(__dirname, '../json/' + tokensFilename);

const ngramsFilename = 'nlp-ngrams.json';
const ngramsFilePath = path.resolve(__dirname, '../json/' + ngramsFilename);

let tokens = [];
let ngrams = [];

export const StopWords = StopWordsPT.concat([
  'pra', 'ta', 'la', 'ie', 'ia', 'ue', 'ua',
  'tao', 'iaia', 'ioio', 'to', 'sao', 'mim', 'tava',
  'ai', 'le', 'eh',
]);

export const StopWordsEnglish = [
  // extra English text scraped
  'translation', 'includes', 'english', 'audio', 'and', 'link', 'by',
];

export const loadTokensFromFile = () => {
  return new Promise((res, rej) => {
    fs.exists(tokensFilePath, (exists) => {
      if (exists) {
        fs.readFile(tokensFilePath, 'utf8', (err, data) => {
          if (err) {
            rej(err);
            return;
          }

          tokens = JSON.parse(data);
          res(tokens);
        });
      } else {
        res(tokens);
      }
    });
  });
};

export const writeTokensToFile = (tokensToWrite) => {
  return new Promise((res, rej) => {
    fs.writeFile(tokensFilePath, JSON.stringify(tokensToWrite, null, 2), 'utf8', (err) => {
      if (err) {
        console.log(err.message);
        rej(err);
        return;
      }

      tokens = tokensToWrite;
      res();
    });
  });
};

export const normalizeToken = (token) => {
  return _.deburr(token.toLowerCase());
};

export const loadNGramsFromFile = () => {
  return new Promise((res, rej) => {
    fs.exists(ngramsFilePath, (exists) => {
      if (exists) {
        fs.readFile(ngramsFilePath, 'utf8', (err, data) => {
          if (err) {
            rej(err);
            return;
          }

          ngrams = JSON.parse(data);
          res(ngrams);
        });
      } else {
        res(ngrams);
      }
    });
  });
};

export const writeNGramsToFile = (ngramsToWrite) => {
  return new Promise((res, rej) => {
    fs.writeFile(ngramsFilePath, JSON.stringify(ngramsToWrite, null, 2), 'utf8', (err) => {
      if (err) {
        console.log(err.message);
        rej(err);
        return;
      }

      ngrams = ngramsToWrite;
      res();
    });
  });
};
