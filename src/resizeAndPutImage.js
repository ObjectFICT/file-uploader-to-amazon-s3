const formidable = require('formidable');
const Transform = require('stream').Transform;
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client } = require("@aws-sdk/client-s3");
const { uuid } = require('uuidv4');
const config = require('config')
const sharp = require('sharp');

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const maxFileSizeMB = config.get('maxFileSize'); // maximum download file size
const maxFileSizeByte = maxFileSizeMB * 1024 * 1024; // MBs converted to bytes
const allowEmptyFiles = config.get('allowEmptyFiles'); //
const queueSize = config.get('queueSize'); // optional concurrency configuration
const partSize = config.get('partSize') * 1024 * 1024; // optional size of each part, in bytes, at least 5MB
const leavePartsOnError = config.get('leavePartsOnError'); // optional manually handle dropped parts

const resizeAndPutImage = (req, percentage) => {
  return new Promise((resolve, reject) => {
    let options = {
      maxFileSize: maxFileSizeByte,
      allowEmptyFiles: allowEmptyFiles
    }

    const form = formidable(options);

    form.on('error', error => {
      const message = error.httpCode === 413
        ? `The file size is too large! Max file size is ${maxFileSizeMB} MB!`
        : error.code === 1010 && error.httpCode === 400
          ? `Empty file or file with 0 MB size is not allowed!`
          : error.message;

      reject({
        message: message,
        code: error.code,
        httpCode: error.httpCode
      })
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("An error occurred while validating the file!");
        return reject({ message: err.message });
      }

      const file = files.file;
      if (!file) {
        return reject({ message: "No file uploaded" });
      }

      const filePath = file.filepath;
      const formatFile = file.originalFilename.split('.').pop();
      const newFileName = `${uuid()}.${formatFile}`;

      sharp(filePath)
        .metadata()
        .then(metadata => {
          const newWidth = Math.round(metadata.width * (percentage / 100));

          return sharp(filePath)
            .resize({ width: newWidth, fit: 'inside' })
            .toBuffer();
        })
        .then(resizedBuffer => {
          console.info(`Uploading ${newFileName} (${percentage}%) to S3...`);

          return new Upload({
            client: new S3Client({
              credentials: { accessKeyId, secretAccessKey }, region
            }),
            params: {
              ACL: 'public-read',
              Bucket,
              Key: newFileName,
              Body: resizedBuffer,
              ContentType: file.mimetype || 'application/octet-stream'
            },
            partSize,
            queueSize,
            leavePartsOnError
          }).done();
        })
        .then(uploadData => {
          console.info(`Finished uploading ${newFileName} (${percentage}%) to S3!`);

          resolve({
            statusCode: 200,
            size: percentage,
            post_uuid: uploadData.Key,
            s3_bucket_retrieval_link: uploadData.Location
          });
        })
        .catch(error => {
          console.error("Error processing file:", error);
          reject({ message: error.message });
        });
    });

    form.on('data', data => {
      if (data.$metadata.httpStatusCode === 200) {
        console.log("Upload info:");
        console.log(data);

        resolve({
          statusCode: data.$metadata.httpStatusCode,
          post_uuid: data.Key,
          s3_bucket_retrieval_link: data.Location
        })
      }
    })

  })
}

module.exports = resizeAndPutImage;
