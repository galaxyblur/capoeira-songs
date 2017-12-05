import vo from 'vo';
import Nightmare from 'nightmare';

import {
  doesSongExistInCollection,
  loadSongsFromFile,
  standardizeTitle,
  writeSongsToFile,
} from '../lib/SongsHelper';

const getSongs = () => {
  const nightmare = Nightmare({ show: true, dock: true });

  return new Promise((res, rej) => {
    nightmare
      .goto('http://capoeiralyrics.info/')
      .evaluate((sel) => {
        const songs = [];

        document.querySelectorAll(sel).forEach((el) => {
          const songObj = { tags: [] };
          const a = el.querySelector(':scope > a:first-child');
          songObj.title = a.innerText;
          songObj.href = a.href;

          const tags = el.querySelectorAll(':scope .tags > a');
          tags.forEach((t) => {
            songObj.tags.push(t.innerText.replace('#', ''));
          });

          songs.push(songObj);
        });

        return songs;
      }, 'li.song')
      .end()
      .then(songs => res(songs))
      .catch((error) => {
        console.error('Search failed:', error);
        rej(error);
      });
  });
};

getSongs().then((songsList) => {
  const nightmare = Nightmare({ show: true, dock: true });

  loadSongsFromFile().catch(console.error).then((allSongs) => {
    if (!allSongs) {
      console.log('No allSongs');
      return;
    }

    const run = function * () {
      const selectorLyrics = 'article';
      let i;

      for (i = 0; i < songsList.length; i++) {
        const s = songsList[i];

        s.title_std = standardizeTitle(s.title);

        if (doesSongExistInCollection(s, allSongs)) {
          console.log(i, 'skip', s.title_std);
          continue;
        }

        console.log(i, s.title_std);

        const text = yield nightmare.goto(s.href)
          .wait(selectorLyrics)
          .evaluate((sel) => {
            return document.querySelector(sel).innerText.trim();
          }, selectorLyrics);

        if (text) {
          console.log(s.title_std, text);
          allSongs.push({
            href: s.href,
            text,
            tags: s.tags,
            title: s.title,
            title_std: s.title_std,
          });
        } else {
          console.log(`No text found for ${s.title_std}.`);
        }
      }

      nightmare.end().then();
      return allSongs;
    };

    vo(run)((err, allSongs) => {
      // console.log(allSongs);
      writeSongsToFile(allSongs);
    });
  });
});
