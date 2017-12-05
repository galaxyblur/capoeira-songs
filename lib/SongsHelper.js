import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const songsFilename = 'songs.json';
const songsFilePath = path.resolve(__dirname, '../json/' + songsFilename);

let songs = [];

export const loadSongsFromFile = () => {
  return new Promise((res, rej) => {
    fs.exists(songsFilePath, (exists) => {
      if (exists) {
        fs.readFile(songsFilePath, 'utf8', (err, data) => {
          if (err) {
            rej(err);
            return;
          }

          songs = JSON.parse(data);
          res(songs);
        });
      } else {
        res(songs);
      }
    });
  });
};

export const writeSongsToFile = (songsToWrite) => {
  return new Promise((res, rej) => {
    fs.writeFile(songsFilePath, JSON.stringify(songsToWrite, null, 2), 'utf8', (err) => {
      if (err) {
        console.log(err.message);
        rej(err);
        return;
      }

      songs = songsToWrite;
      res();
    });
  });
};

export const standardizeTitle = (title) => {
  return _.kebabCase(_.deburr(title));
};

export const doesSongExistInCollection = (song, songCollection) => {
  const matches = songCollection.filter((songToCheck) => {
    return songToCheck.title_std === song.title_std;
  });

  return matches.length > 0;
};
