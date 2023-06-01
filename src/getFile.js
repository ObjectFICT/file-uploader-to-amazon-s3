const AWS = require('aws-sdk');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const getFile = (fileKey) => {
  console.log('Trying to download file', fileKey);

  AWS.config.update(
    {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: region
    }
  );

  const s3 = new AWS.S3();
  const options = {
    Bucket: Bucket,
    Key: fileKey,
  };

  return s3.getObject(options, (error, data) => {
    if (error != null) {
      console.log("Failed to retrieve an object: " + error)
    } else {
      console.log("Loaded " + data.ContentLength + " bytes from S3 bucket");
    }
  }).createReadStream();
}

module.exports = getFile;