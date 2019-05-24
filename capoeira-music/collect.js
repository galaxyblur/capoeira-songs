import _ from 'lodash';
import vo from 'vo';
import Nightmare from 'nightmare';

import {
  doesSongExistInCollection,
  loadSongsFromFile,
  standardizeTitle,
  writeSongsToFile,
} from '../lib/SongsHelper';

const debug = false;

const getCorridos = () => {
  const nightmare = Nightmare({ show: true, dock: true });

  return new Promise((res, rej) => {
    const run = function * () {
      const letterLinkSelector = 'strong span a';

      const letterLinks = yield nightmare.goto('http://www.capoeira-music.net/all-capoeira-songs/')
        .wait(letterLinkSelector)
        .evaluate((selector) => {
          const links = [];

          document.querySelectorAll(selector).forEach((a) => {
            links.push(a.href);
          });

          return links;
        }, letterLinkSelector);

      const songLinkSelector = '#page .page_item a';
      let songs = [];
      let i;

      for (i = 0; i < letterLinks.length; i++) {
        const l = letterLinks[i];
        const letterSongs = yield nightmare.goto(l)
          .wait(songLinkSelector)
          .evaluate((sel) => {
            const letterLinks = [];

            document.querySelectorAll(sel).forEach((a) => {
              letterLinks.push({
                href: a.href,
                title: a.innerText,
              });
            });

            return letterLinks;
          }, songLinkSelector);

        songs = songs.concat(letterSongs);
      }

      nightmare.end()
        .then()
        .catch((error) => {
          console.error('Search failed:', error);
          rej(error);
        });

      return songs;
    };

    vo(run)((err, songsList) => {
      songsList.forEach(s => s.tag = 'Corrido');
      res(songsList);
    });
  });
};

const getLadainhas = () => {
  const nightmare = Nightmare({ show: true, dock: true });

  return new Promise((res, rej) => {
    const run = function * () {
      const songLinkSelector = '#page .page_item a';

      const songs = yield nightmare.goto('http://www.capoeira-music.net/capoeira-music-ladainhas-quadras/')
        .wait(songLinkSelector)
        .evaluate((selector) => {
          const links = [];

          document.querySelectorAll(selector).forEach((a) => {
            links.push({
              href: a.href,
              title: a.innerText,
            });
          });

          return links;
        }, songLinkSelector);

      nightmare.end()
        .then()
        .catch((error) => {
          console.error('Search failed:', error);
          rej(error);
        });

      return songs;
    };

    vo(run)((err, songsList) => {
      songsList.forEach(s => s.tag = 'Ladainha');
      res(songsList);
    });
  });
};

const getMaculele = () => {
  const nightmare = Nightmare({ show: true, dock: true });

  return new Promise((res, rej) => {
    const run = function * () {
      const songLinkSelector = '#page .page_item a';

      const songs = yield nightmare.goto('http://www.capoeira-music.net/maculele/')
        .wait(songLinkSelector)
        .evaluate((selector) => {
          const links = [];

          document.querySelectorAll(selector).forEach((a) => {
            links.push({
              href: a.href,
              title: a.innerText,
            });
          });

          return links;
        }, songLinkSelector);

      nightmare.end()
        .then()
        .catch((error) => {
          console.error('Search failed:', error);
          rej(error);
        });

      return songs;
    };

    vo(run)((err, songsList) => {
      songsList.forEach(s => s.tag = 'Maculele');
      res(songsList);
    });
  });
};

const getSambaDeRoda = () => {
  const nightmare = Nightmare({ show: true, dock: true });

  return new Promise((res, rej) => {
    const run = function * () {
      const songLinkSelector = '#page .page_item a';

      const songs = yield nightmare.goto('http://www.capoeira-music.net/samba-de-roda-2/')
        .wait(songLinkSelector)
        .evaluate((selector) => {
          const links = [];

          document.querySelectorAll(selector).forEach((a) => {
            links.push({
              href: a.href,
              title: a.innerText,
            });
          });

          return links;
        }, songLinkSelector);

      nightmare.end()
        .then()
        .catch((error) => {
          console.error('Search failed:', error);
          rej(error);
        });

      return songs;
    };

    vo(run)((err, songsList) => {
      songsList.forEach(s => s.tag = 'Samba de Roda');
      res(songsList);
    });
  });
};

Promise.all([
  getCorridos(),
  getLadainhas(),
  getMaculele(),
  getSambaDeRoda(),
]).then((songsListArr) => {
  const nightmare = Nightmare({
    show: true,
    openDevTools: debug,
    dock: true,
    waitTimeout: 5000,
  });
  const combinedSongs = _.flatten(songsListArr);
  combinedSongs.forEach(s => s.title = s.title.replace(/ \(EN\)/, ''));

  // console.log(combinedSongs);

  loadSongsFromFile().catch(console.error).then((allSongs) => {
    if (!allSongs) {
      console.log('No allSongs');
      return;
    }

    const run = function * () {
      const selectorLyrics = [
        '#page > div:nth-child(2) > div:first-child > div:first-child > div:first-child',
        '#page > div:first-child > div:first-child > div:first-child',
        '#page > div:nth-child(2) > div:nth-child(3) > div:first-child',
        '#page > div:nth-child(2) > div > div:first-child',
        '#page > div:nth-child(3) > div',
        '#page > div:nth-child(2)',
        '#page > div > p',
      ];
      const selectorLyricsAll = [
        '#page > div:nth-child(2) > p',
        '#page > div > p',
        '#page > p',
      ];

      let i;

      for (i = 0; i < combinedSongs.length; i++) {
        const s = combinedSongs[i];
        s.title_std = standardizeTitle(s.title);
        console.log(i, s.title_std);

        if (doesSongExistInCollection(s, allSongs)) {
          // continue;
        }

        const text = yield nightmare.goto(s.href)
          .wait('#page')
          .evaluate((sel, selAll) => {
            let t = '';

            sel.forEach((selector) => {
              if (t === '') {
                const el = document.querySelector(selector);

                if (el) {
                  t = el.innerText.trim();
                }
              }
            });

            if (t !== '') {
              return t;
            }

            t = '';

            selAll.forEach((selector) => {
              if (t === '') {
                document.querySelectorAll(selector).forEach(el => t += `\n${el.innerText}`);
              }
            });

            return t !== '' ? t : undefined;
          }, selectorLyrics, selectorLyricsAll)
          .catch(err => console.error);

        if (text) {
          const textFinal = text.replace(/\n{1,2}Listen to.*:/gi, '');
          console.log(s.title_std, textFinal);

          allSongs.push({
            href: s.href,
            text: textFinal,
            tags: [s.tag],
            title: s.title,
            title_std: s.title_std,
          });
        } else {
          console.warn(`No text found for ${s.title_std} at ${s.href}`);
        }
      }

      nightmare.end().then();
      return allSongs;
    };

    vo(run)((err, allSongs) => {
      if (!allSongs) {
        console.log(allSongs);
      } else {
        console.log(`Writing ${allSongs.length} songs to file.`);
        writeSongsToFile(allSongs);
      }
    });
  });
});
