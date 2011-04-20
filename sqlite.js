function SQLite(cfg) {
  if (typeof window.openDatabase === 'undefined') {
    return;
  }

  function log(str) {
    if (typeof console !== 'undefined') {
      console.log(str);
    }
  }


  // Default Handlers
  function nullDataHandler(transaction, results) { }

  function errorHandler(transaction, error) {
    log('Oops.  Error was ' + error.message + ' (Code ' + error.code + ')');
  }

  var config = cfg || {}, db;
  
  config.shortName = config.shortName || 'mydatabase';
  config.version = config.version || '1.0';
  config.displayName = config.displayName || 'My SQLite Database';
  config.maxSize = 65536;
  config.defaultErrorHandler = config.defaultErrorHandler || errorHandler;
  config.defaultDataHandler = config.defaultDataHandler || nullDataHandler;

  try {
    db = openDatabase(config.shortName, config.version, config.displayName, config.maxSize);
  } catch (e) {
    if (e === 2) {
      log("Invalid database version.");
    } else {
      log("Unknown error " + e + ".");
    }

    return;
  }

  function execute(query, v, d, e) {
    var values = v || [],
      dH = d || config.defaultDataHandler,
      eH = e || config.defaultErrorHandler;

    if (!query || query === '') {
      return;
    }

    db.transaction(
      function (transaction) {
        transaction.executeSql(query, values, dH, eH);
      }
    );
  }

  return {
    database: db,
    createTable: function (name, cols, data, error) { 
      var query = "CREATE TABLE " + name + "(" + cols + ");";
      execute(query, null, data, error);
    },
    insert: function (table, map, data, error) {
      var query = "INSERT INTO " + table + " (#k#) VALUES(#v#);", keys = [], values = [], x;

      for (x in map) {
        if (map.hasOwnProperty(x)) {
          keys.push(x);
          values.push('"' + map[x] + '"');
        }
      }

      query = query.replace("#k#", keys.join(','));
      query = query.replace("#v#", values.join(','));

      execute(query, null, data, error);
    },
    update: function (table, map, conditions, data, error) {
      var query = "UPDATE " + table + " SET #k##m#", keys = [], values = [], matches = [], x;

      for (x in map) {
        if (map.hasOwnProperty(x)) {
          keys.push(x + '=?');
          values.push(map[x]);
        }
      }

      if (typeof conditions === 'string') {
        matches.push(conditions);
      } else if (typeof conditions === 'number') {
        matches.push("id=?");
        values.push(conditions);
      } else if (typeof conditions === 'object') {
        for (x in conditions) {
          if (conditions.hasOwnProperty(x)) {
            if (x.match(/^\d+$/)) {
              matches.push(conditions[x]);
            } else {
              matches.push(x + '=?');
              values.push(conditions[x]);
            }
          }
        }
      }

      if (matches.length > 0) {
        matches = " WHERE " + matches.join(' AND ');
      } else {
        matches = '';
      }

      query = query.replace("#k#", keys.join(','));
      query = query.replace("#m#", matches);

      execute(query, values, data, error);
    },
    select: function (table, columns, conditions, data, error) {
      var query = 'SELECT #col# FROM ' + table + '#cond#;', matches = [], x;

      if (typeof columns === 'undefined') {
        columns = '*';
      } else if (typeof columns === 'object') {
        columns.join(',');
      }

      if (typeof conditions === 'string') {
        matches.push(conditions);
      } else if (typeof conditions === 'number') {
        matches.push("id=" + conditions);
      } else if (typeof conditions === 'object') {
        for (x in conditions) {
          if (conditions.hasOwnProperty(x)) {
            if (x.match(/^\d+$/)) {
              matches.push(conditions[x]);
            } else {
              matches.push(x + '=' + conditions[x]);
            }
          }
        }
      }

      if (matches.length > 0) {
        matches = " WHERE " + matches.join(' AND ');
      }

      query = query.replace('#col#', columns);
      query = query.replace('#cond#', matches);

      execute(query, null, data, error);
    },
    destroy: function (table, conditions, data, error) {
      var query = 'DELETE FROM ' + table + '#c#;', matches = [], x;

      if (typeof conditions === 'string') {
        matches.push(conditions);
      } else if (typeof conditions === 'number') {
        matches.push("id=" + conditions);
      } else if (typeof conditions === 'object') {
        for (x in conditions) {
          if (conditions.hasOwnProperty(x)) {
            if (x.match(/^\d+$/)) {
              matches.push(conditions[x]);
            } else {
              matches.push(x + '=' + conditions[x]);
            }
          }
        }
      }

      if (matches.length > 0) {
        matches = " WHERE " + matches.join(' AND ');
      }

      query = query.replace('#c#', matches);

      execute(query, null, data, error);
    }
  };
}