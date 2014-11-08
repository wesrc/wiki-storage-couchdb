var cradle  = require('cradle')
  , fsPage   = require('wiki-server/lib/page')
  , synopsis = require('wiki-client/lib/synopsis');

module.exports = function (opts) {
  var config         = opts.database
    , options        = config.options || {}
    , classicPageGet = fsPage(opts).get
    , connection     = new(cradle.Connection)
    , db = connection.database('pages');

  if (!config) {
      console.log(opts);
      throw new Error("The couchdb url is missing from database configuration")
  }
  db.create();

  function put (file, page, cb) {
    page.slug = file;
    db.save(page.slug, page, cb);
  }

  function get (file, cb) {
    db.get(file, function (err, page) {

      if (err) {
        if (err.error !== 'not_found') return cb(err)
      }

      if (page === undefined) {
        return classicPageGet(file, cb);
      }

      cb(null, page);
    });
  }

  function pages (cb) {
    db.all({}, function(err, rawPages) {
      var digests = rawPages.map(function (rawPage) {
        return {
          slug:     rawPage.slug,
          title:    rawPage.title,
          date:     rawPage.date,
          synopsis: synopsis(rawPage)
        };
      });

      cb(null, digests);
    });
  }

  return { put: put, get: get, pages:pages };
};
