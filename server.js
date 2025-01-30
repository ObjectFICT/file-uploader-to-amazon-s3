require('dotenv').config();
const cors = require('cors');
const path = require("path");
const fileParser = require('./src/putFile');
const getFile = require('./src/getFile');

const express = require('express');
const config = require("config");
const app = express();
const PORT = process.env.PORT;
const ALLOWED_URL = process.env.ALLOWED_URL;

app.set('json spaces', 5);
app.use(express.static('public'))

const allowedList = [ALLOWED_URL]
const corsOptions = (req, callback) => {
  const corsOptions = allowedList.indexOf(req.header('Origin')) !== -1
    ? { origin: true }
    : { origin: false };

  callback(null, corsOptions);
}

const showConfig = () => {
  const maxFileSizeMB = config.get('maxFileSize'); // maximum download file size
  const allowEmptyFiles = config.get('allowEmptyFiles');
  const queueSize = config.get('queueSize'); // optional concurrency configuration
  const partSize = config.get('partSize') * 1024 * 1024; // optional size of each part, in bytes, at least 5MB
  const leavePartsOnError = config.get('leavePartsOnError'); // optional manually handle dropped parts

  console.log(`Configuration`);
  console.log(`Max file size - ${maxFileSizeMB} MB`);
  console.log(`Allow empty files - ${allowEmptyFiles}`);
  console.log(`Queue size - ${queueSize}`);
  console.log(`Part size - ${partSize} bytees`);
  console.log(`Leave parts on error - ${leavePartsOnError}`);
}

app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/upload', cors(), async (req, res) => {
  console.info("**********Start upload file process**********");
  showConfig();

  await fileParser(req, 25)
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

  getFile(fileKey)
    .then((stream) => {
      stream.pipe(res)
    })
    .catch(error => {
      res.status(500).json({
        error: error
      });
    });
});

app.get('/api/health', (req, res, next) => {
  res.status(200).json({
    health: "OK"
  })
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
