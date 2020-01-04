const rp = require('request-promise');
const $ = require('cheerio');
const url = 'http://talkorigins.org/indexcc/list.html';

const { from } = require('rxjs');
const { map, combineLatest } = require('rxjs/operators');

const claimsRegex = /^(?:(?<category>[A-Z]{2})(?<id>[0-9]{3})(?:\.)(?<subId>[0-9])?)(?:\.)?(?:\s)?(?<text>.*)/gm;
const categoriesRegex = /^(?<category>[A-Z]{2})\:\s(?<name>.*)/gm;
const tagsRegex = /^(?:(?<category>[A-Z]{2})(?<start>[0-9]{3}))(?:\-?)(?:[A-Z]{2}(?<end>[0-9]{3}))?\:\s(?<name>.*)/gm;
const linkRegex = /[A-Z]{2}\/(?<category>[A-Z]{2})(?<id>[0-9]{3})(?:\_(?<subId>[0-9]))?\.html/

const match = (str, regex) => {
  let results = [];
  let match;

  do {
    match = regex.exec(str);
    if (match) {
      results.push(match.groups);
    }
  } while (match);

  return results;
}

const page = from(rp(url));

const mainList = page.pipe(
  map((html) => $('h2, ul', html)),
);

const allLinks = page.pipe(
  map((html) => $('li > a', html).get()),
  map((links) => links.filter((link) => typeof link.attribs.href === 'string')),
  map((links) => links.map((link) => link.attribs.href.match(linkRegex))),
  map((links) => links.filter((link) => link !== null)),
  map((links) => links.map((item) => ({
    ...item.groups,
    link: item.input
  })))
);

const listText = mainList.pipe(
  map((list) => list.text())
);

const getClaims = listText.pipe(
  map((list) => match(list, claimsRegex)),
);

const getCategories = listText.pipe(
  map((list) => match(list, categoriesRegex))
);

const getTags = listText.pipe(
  map((list) => match(list, tagsRegex))
);


//allLinks.subscribe((links) => console.log('LINKS:', links));

getClaims.pipe(
  combineLatest(allLinks),
  map(([claims, links]) => {
    return claims.map((claim) => {
      const linkIndex = links.findIndex((link) => (
        link.id === claim.id &&
        link.subId === claim.subId
      ));

      if (linkIndex >= 0) {
        return {
          ...claim,
          link: links[linkIndex].link
        };
      } else {
        return {
          ...claim,
          link: ''
        }
      }
    })
  })
).subscribe((claims) => {
  console.log('CLAIMS:', claims)
});

//getClaims.subscribe((claims) => console.log('CLAIMS:', claims[0]));
// getCategories.subscribe((categories) => console.log('CATEGORIES:', categories));
//getTags.subscribe((tags) => console.log('TAGS:', tags));

