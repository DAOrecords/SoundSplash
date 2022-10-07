const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const uploadRoutes = require('./routes/upload.js');
const fetchRoutes = require('./routes/fetch.js');
const fillRoutes = require('./routes/fill.js');
const getRoutes = require('./routes/get.js');
const updateRoutes = require('./routes/update');

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/daorecords.io/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/daorecords.io/cert.pem')
};

const HTTP_PORT = 3000;
const HTTPS_PORT = 8443;


// CORS (we allow everything)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get('/', function (req, res) {
  res.send("Hello World!");
});

// Routes
app.use('/upload', uploadRoutes);
app.use('/fetch', fetchRoutes);
app.use('/fill', fillRoutes);
app.use('/update', updateRoutes);
app.use('/get', getRoutes);


const sslApp = https.createServer(sslOptions, app);

sslApp.listen(HTTPS_PORT, function () {
  console.log(`(SSL) IPFS pinner app listening on port ${HTTPS_PORT}!`);
});


app.listen(HTTP_PORT, function () {
  console.log(`IPFS pinner app listening on port ${HTTP_PORT}!`);
});