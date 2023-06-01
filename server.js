require('dotenv').config();
const path = require("path");
const fileParser = require('./src/putFile');
const getFile = require('./src/getFile');

const express = require('express');
const app = express();
const PORT = process.env.PORT;

app.set('json spaces', 5);
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/upload', async (req, res) => {
  console.info("**********Start upload file process**********");
  await fileParser(req)
    .then(data => {
      res.status(200).json({
        statusCode: data.statusCode,
        post_uuid: data.post_uuid,
        s3_bucket_retrieval_link: data.s3_bucket_retrieval_link
      })
    })
    .catch(error => {
      res.status(500).json({
        error: error
      })
    })
  console.info("**********Finish upload file process**********");
});

app.get('/api/download', (req, res, next) => {
  const fileKey = req.query['file'];

  res.attachment(fileKey);

  getFile(fileKey).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});