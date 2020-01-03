const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States';

rp(url)
.then((html) => {
  //success!
  console.log($('big > a', html).length);
  console.log($('big > a', html));

})
.catch((err) => {
  //handle error
  console.log('HERE IS ERROR:', err);
});
