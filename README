A very simple Javascript layer for the web based SQLite database.

example usage:

var db = SQLite({ shortName: 'mydb' });

db.createTable('people', 'name TEXT, age INTEGER');

db.insert('people', { name: 'Jeremy', age: 29 });

db.update('people', { age: 30 }, { name: 'Jeremy' });

db.select('people', '*', { age: 30 }, function (results) { var x; for(x=0; x<results.rows.length; x++) { console.log(results.rows.item(x)); } });

db.destroy('people', { age: 30 });

Conditions can be:
  * a number: defaults to 'WHERE id=number'
  * a string: generates 'WHERE string'
  * an array: generates 'WHERE val1 AND val2'
  * a hash:   generates 'WHERE key=hash[key] AND key2=hash[key2]'