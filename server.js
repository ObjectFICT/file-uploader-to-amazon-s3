require('dotenv').config();

const express = require('express');
const app = express();
const path = require("path");
const PORT = process.env.PORT;
const fileParser = require('./fileparser');

app.set('json spaces', 5);
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/upload', async (req, res) => {
  await fileParser(req)
    .then(data => {
      res.status(200).json({
        statusCode: data.statusCode,
        post_uuid: data.post_uuid,
        s3_bucket_retrieval_link: data.s3_bucket_retrieval_link
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