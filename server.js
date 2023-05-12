const express = require('express');
const app = express();
const PORT = process.env.PORT;
const path = require("path");
const fileParser = require('./fileparser');

require('dotenv').config();

app.set('json spaces', 5);
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/upload', async (req, res) => {
  await fileParser(req)
    .then(data => {
      res.status(200).json({
        message: "Success",
        data
      })
    })
    .catch(error => {
      res.status(400).json({
        message: "An error occurred.",
        error
      })
    })
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});