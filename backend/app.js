const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');
const uploadRoutes = require('./routes/upload.js');
const fetchRoutes = require('./routes/fetch.js');
const fillRoutes = require('./routes/fill.js');

const sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/daorecords.io/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/daorecords.io/cert.pem')
};


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


const sslApp = https.createServer(sslOptions, app);

sslApp.listen(8443, function () {
  console.log("(SSL) IPFS pinner app listening on port 8443!");
});


app.listen(3000, function () {
  console.log("IPFS pinner app listening on port 3000!");
});