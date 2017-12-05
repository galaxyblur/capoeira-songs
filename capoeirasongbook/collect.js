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
    const songLinks = '#pt-cv-view-d27a284e72 h4 a';

    nightmare
      .goto('http://capoeirasongbook.com/songs/')
      .evaluate((selector) => {
        const songs = [];

        document.querySelectorAll(selector).forEach((a) => {
          const title = a.innerText;
          const href = a.href;

          songs.push({
            href,
            title,
          });
        });

        return songs;
      }, songLinks)
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
      const selectorLyrics = '#tab-ptg .wpb_wrapper';
      const selectorTags = 'article .article-meta a[rel="category tag"';
      let i;

      for (i = 0; i < songsList.length; i++) {
        const s = songsList[i];
        console.log(i, s.title);

        s.title_std = standardizeTitle(s.title);

        if (doesSongExistInCollection(s, allSongs)) {
          continue;
        }

        const text = yield nightmare.goto(s.href)
          .wait(selectorLyrics)
          .evaluate((sel) => {
            return document.querySelector(sel).innerText;
          }, selectorLyrics);

        const tags = yield nightmare.wait(selectorTags)
          .evaluate((sel) => {
            const t = [];

            document.querySelectorAll(sel).forEach((a) => {
              t.push(a.innerText);
            });

            return t;
          }, selectorTags);

        allSongs.push({
          href: s.href,
          text,
          tags,
          title: s.title,
          title_std: s.title_std,
        });
      }

      nightmare.end().then();
      return allSongs;
    };

    vo(run)((err, allSongs) => {
      console.log(allSongs);
      writeSongsToFile(allSongs);
    });
  });
});
