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
      return (/^\d+$/).test(val);
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
    var results = [], values = [], x;

    if (typeof conditions === 'string') {
      results.push(conditions);
    } else if (typeof conditions === 'number') {
      results.push("id=?");
      values.push(conditions);
    } else if (typeof conditions === 'object') {
      for (x in conditions) {
        if (conditions.hasOwnProperty(x)) {
          if (isNumber(x)) {
            results.push(conditions[x]);
          } else {
            results.push(x + '=?');
            values.push(conditions[x]);
          }
        }
      }
    }

    if (results.length > 0) {
      results = " WHERE " + results.join(' AND ');
    } else {
      results = '';
    }

    return [results, values];
  }

  function createTableSQL(name, cols) {
    var query = "CREATE TABLE " + name + "(" + cols + ");";

    return [query, []];
  }

  function dropTableSQL(name) {
    var query = "DROP TABLE " + name + ";";

    return [query, []];
  }

  function insertSQL(table, map) {
    var query = "INSERT INTO " + table + " (#k#) VALUES(#v#);", keys = [], holders = [], values = [], x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        keys.push(x);
        holders.push('?');
        values.push(map[x]);
      }
    }

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#v#", holders.join(','));

    return [query, values];
  }

  function updateSQL(table, map, conditions) {
    var query = "UPDATE " + table + " SET #k##m#", keys = [], values = [], x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        keys.push(x + '=?');
        values.push(map[x]);
      }
    }

    conditions = buildConditions(conditions);

    values = values.concat(conditions[1]);

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#m#", conditions[0]);

    return [query, values];
  }

  function selectSQL(table, columns, conditions, options) {
    var query = 'SELECT #col# FROM ' + table + '#cond#', values = [];

    if (typeof columns === 'undefined') {
      columns = '*';
    } else if (typeof columns === 'object') {
      columns.join(',');
    }

    conditions = buildConditions(conditions);

    values = values.concat(conditions[1]);

    query = query.replace("#col#", columns);
    query = query.replace('#cond#', conditions[0]);

    if (options) {
      if (options.limit) {
        query = query + ' LIMIT ?';
        values.push(options.limit);
      }
      if (options.order) {
        query = query + ' ORDER BY ?';
        values.push(options.order);
      }
      if (options.offset) {
        query = query + ' OFFSET ?';
        values.push(options.offset);
      }
    }

    query = query + ';';

    return [query, values];
  }

  function destroySQL(table, conditions) {
    var query = 'DELETE FROM ' + table + '#c#;';

    conditions = buildConditions(conditions);

    query = query.replace('#c#', conditions[0]);

    return [query, conditions[1]];
  }

  return {
    database: db,
    createTable: function (name, cols, data, error) {
      var sql = createTableSQL(name, cols);
      execute(sql[0], sql[1], data, error);
    },
    dropTable: function (name, data, error) { 
      var sql = dropTableSQL(name);
      execute(sql[0], sql[1], data, error);
    },
    insert: function (table, map, data, error) {
      var sql = insertSQL(table, map);
      execute(sql[0], sql[1], data, error);
    },
    update: function (table, map, conditions, data, error) {
      var sql = updateSQL(table, map, conditions);
      execute(sql[0], sql[1], data, error);
    },
    select: function (table, columns, conditions, options, data, error) {
      var sql = selectSQL(table, columns, conditions, options);
      execute(sql[0], sql[1], data, error);
    },
    destroy: function (table, conditions, data, error) {
      var sql = destroySQL(table, conditions);
      execute(sql[0], sql[1], data, error);
    }
  };
}