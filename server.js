// app.js

// [LOAD PACKAGES]
const mysql = require('mysql2');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs').renderFile;

// [CONFIGURE APP VIEW ENGINE]
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', ejs);

// [CONFIGURE APP TO USE bodyParser]
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// [CONFIGURE APP TO USE static path]
app.use(express.static('public'));

// [CONFIGURE SERVER PORT]
let port = process.env.PORT || 8080;

// [CONNECT MYSQL]
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'bookdatabase',
  password: 'thddnjs12!',
});

console.log('connection success!');

// [RUN SERVER]
let server = app.listen(port, function () {
  console.log('Express server has started on port ' + port);
});

// [CONFIGURE ROUTER]
let router = require('./routes')(app, conn);
