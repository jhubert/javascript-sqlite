function SQLite(cfg) {
  if (typeof window.openDatabase === 'undefined') {
    return;
  }

  function log(str) {
    if (typeof console !== 'undefined') {
      console.log(str);
    }
  }

  function isNumber(val) {
    switch (typeof val) {
    case 'number':
      return true;
    case 'string':
      return /^\d+$/.test(val);
    case 'object':
      return false;
    }
  }

  // Default Handlers
  function nullDataHandler(results) { }

  function errorHandler(error) {
    log('Oops. ' + error.message + ' (Code ' + error.code + ')');
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

    function err(t, error) {
      eH(error, query);
    }

    function data(t, result) {
      dH(result, query);
    }

    db.transaction(
      function (transaction) {
        transaction.executeSql(query, values, data, err);
      }
    );
  }

  function buildConditions(conditions) {
    var results = [], x;

    if (typeof conditions === 'string') {
      results.push(conditions);
    } else if (typeof conditions === 'number') {
      results.push("id=" + conditions);
    } else if (typeof conditions === 'object') {
      for (x in conditions) {
        if (conditions.hasOwnProperty(x)) {
          if (isNumber(x)) {
            results.push(conditions[x]);
          } else {
            if (isNumber(conditions[x])) {
              results.push(x + '=' + conditions[x]);
            } else {
              results.push(x + '="' + conditions[x] + '"');
            }
          }
        }
      }
    }

    if (results.length > 0) {
      results = " WHERE " + results.join(' AND ');
    } else {
      results = '';
    }

    return results;
  }
  

  function createTableSQL(name, cols) {
    var query = "CREATE TABLE " + name + "(" + cols + ");";

    return query;
  }

  function insertSQL(table, map) {
    var query = "INSERT INTO " + table + " (#k#) VALUES(#v#);", keys = [], values = [], x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        keys.push(x);
        if (isNumber(map[x])) {
          values.push(map[x]);
        } else {
          values.push('"' + map[x] + '"');
        }
      }
    }

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#v#", values.join(','));

    return query;
  }

  function updateSQL(table, map, conditions) {
    var query = "UPDATE " + table + " SET #k##m#", keys = [], matches = '', x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        if (isNumber(map[x])) {
          keys.push(x + '=' + map[x]);
        } else {
          keys.push(x + '="' + map[x] + '"');
        }
      }
    }

    matches = buildConditions(conditions);

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#m#", matches);

    return query;
  }

  function selectSQL(table, columns, conditions, options) {
    var query = 'SELECT #col# FROM ' + table + '#cond#;', matches = '';

    if (typeof columns === 'undefined') {
      columns = '*';
    } else if (typeof columns === 'object') {
      columns.join(',');
    }

    matches = buildConditions(conditions);

    query = query.replace('#col#', columns);
    query = query.replace('#cond#', matches);

    return query;
  }

  function destroySQL(table, conditions) {
    var query = 'DELETE FROM ' + table + '#c#;', matches = '';

    matches = buildConditions(conditions);

    query = query.replace('#c#', matches);

    return query;
  }

  return {
    database: db,
    createTable: function (name, cols, data, error) { 
      execute(createTableSQL(name, cols), null, data, error);
    },
    insert: function (table, map, data, error) {
      execute(insertSQL(table, map), null, data, error);
    },
    update: function (table, map, conditions, data, error) {
      execute(updateSQL(table, map, conditions), null, data, error);
    },
    select: function (table, columns, conditions, options, data, error) {
      execute(selectSQL(table, columns, conditions, options), null, data, error);
    },
    destroy: function (table, conditions, data, error) {
      execute(destroySQL(table, conditions), null, data, error);
    }
  };
}