var cradle  = require('cradle')
  , fsPage   = require('wiki-server/lib/page')
  , synopsis = require('wiki-client/lib/synopsis');

module.exports = function (opts) {
  var config         = opts.database
    , dbName         = config.name || 'pages'
    , host           = config.host || '127.0.0.1'
    , port           = config.port || 5984
    , classicPageGet = fsPage(opts).get
    , connection     = new(cradle.Connection)(host, port)
    , db = connection.database(dbName);

  if (!config) {
      throw new Error("The couchdb url is missing from database configuration")
  }

  db.exists(function (err, exists) {
      if (err) {
          console.log('error', err);
      } else if (exists) {
          console.log('the force is with you.');
      } else {
          console.log('database does not exists.');
          db.create();
          /* populate design documents */
      }
  });

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
