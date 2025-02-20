import express from 'express';
import sqlite3 from 'better-sqlite3';

// Create a new web server and store in a variable called app
let app = express();

// Tell the web server that we want to be able to use request bodies
// (necessary to make POST and PUT request work in a REST api)
app.use(express.json());

// Tell the web server to serve all files in the frontend folder
app.use(express.static('frontend'));

// Start the web server
app.listen(3001, () => console.log('Listening on http://localhost:3001'));

// Connect to the database
let db = sqlite3('./petsAndOwners.db');

// A list of tables and views
let tablesAndViews = [
  { name: 'pets', type: 'table' },
  { name: 'petOwners', type: 'table' },
  { name: 'peopleWithoutPets', type: 'view' },
  { name: 'petOwnersAndPets', type: 'view' },
  { name: 'petsWithoutOwners', type: 'view' }
];

// Loop through the tables and views and create REST routes for each table and view


for (let table of tablesAndViews) {

  // Get/read a list of all rows
  app.get(`/api/${table.name}`, (request, response) => {
    // Run a SELECT query to get all data from the table products
    // and store the result in the variable products
    let products = db.prepare(`SELECT * FROM ${table.name}`).all();
    // Send the response to the frontend in JSON format
    response.json(products);
  });

  // Get/read info about a specific row
  app.get(`/api/${table.name}/:id`, (request, response) => {
    let id = request.params.id;
    // Create a prepared statement with the SQL query + the data/parameter values
    // to use in the prepared statement
    let sql = `SELECT * FROM ${table.name} WHERE id = :id`;
    // no id in the view petOwnersAndPets, use petOwnerId instead
    if (table.name === 'petOwnersAndPets') {
      sql = `SELECT * FROM petOwnersAndPets WHERE petOwnerId = :id`;
    }
    let preparedStatement = db.prepare(sql);
    let result = preparedStatement.all({ id });
    // Send the response to the frontend in JSON format
    response.json(result);
  });

  // Only add POST/PUT/DELETE routes for tables (not views)
  if (table.type === 'table') {

    // Post/create a new row
    app.post(`/api/${table.name}`, (request, response) => {
      // Read the request body
      let body = request.body;
      // Create string containing column and parameter names
      // based on the request body
      let columns = '';
      let parameters = '';
      for (let key of Object.keys(body)) {
        columns += key + ', ';
        parameters += ':' + key + ', ';
      }
      // remove trailing commas
      columns = columns.slice(0, -2);
      parameters = parameters.slice(0, -2);
      // Create the SQL query as a prepared statement
      let preparedStatement = db.prepare(`
        INSERT INTO ${table.name} (${columns})
        VALUES (${parameters})
      `);
      // Run the query (using the data from the request body)
      let result = preparedStatement.run(body);
      // Send the result of the query to the frontend in JSON format
      response.json(result);
    });

    // Update data about a row
    app.put(`/api/${table.name}/:id`, (request, response) => {
      // Read the id from the request parameters
      let id = request.params.id;
      // Read the request body
      let body = request.body;
      // Create an UPDATE SQL query based on which properties
      // the request body says that we should change
      let sqlQuery = `UPDATE ${table.name} SET `;
      for (let key of Object.keys(body)) {
        sqlQuery += key + '= :' + key + ', '
      }
      // remove the last trailing comma in the SQL query
      sqlQuery = sqlQuery.slice(0, -2);
      // Add a WHERE clause to the SQL query
      sqlQuery += ' WHERE id=:id';
      // Create a prepared statement based on the sql query
      // we have constructed
      let preparedStatement = db.prepare(sqlQuery);
      // Run the query 
      // (using the data from the request body + id from the route)
      let result = preparedStatement.run({ id, ...body });
      // Return the result
      response.json(result);
    });

    // Delete a row
    app.delete(`/api/${table.name}/:id`, (request, response) => {
      let id = request.params.id;
      // Create a prepared statement with the sql query
      let preparedStatement = db.prepare(`DELETE FROM ${table.name} WHERE id = :id`);
      // Run the sql query
      let result = preparedStatement.run({ id });
      // Return the result
      response.json(result);
    });

  }

}
