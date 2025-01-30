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

const formatForCompression = ["jpeg", "jpg", "png", "webp", "avif"];

const putFile = (req, quality) => {
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

    form.parse(req, (error, fields, files) => {
      console.info("Start validate file!");

      if (error) {
        console.error("An error occurred while validating the file!");
        console.error(error);
        return;
      }

      console.info("Finish validate file!");
    });

    form.on('data', data => {
      if (data.$metadata.httpStatusCode === 200) {
        console.info("Success uploaded!");
        console.log("Upload info:");
        console.log(data);

        resolve({
          statusCode: data.$metadata.httpStatusCode,
          post_uuid: data.Key,
          s3_bucket_retrieval_link: data.Location
        })
      }
    })

    form.on('fileBegin', (formName, file) => {

      file.open = function () {
        const spitedOriginalFileName = this.originalFilename.split('.');
        const formatFile = spitedOriginalFileName[spitedOriginalFileName.length - 1];
        const contentType = req.query['type'] ?? this.mimetype;
        let body;

        if (formatForCompression.includes(formatFile.toLowerCase())) {
          const transformStream = new Transform({
            transform(chunk, encoding, callback) {
              callback(null, chunk);
            }
          });

          this._writeStream = transformStream;
          let compressedStream = sharp();
          switch (formatFile) {
            case 'jpeg':
            case 'jpg':
              compressedStream = compressedStream.jpeg({ quality });
              break;
            case 'png':
              compressedStream = compressedStream.png({ quality });
              break;
            case 'webp':
              compressedStream = compressedStream.webp({ quality });
              break;
            case 'avif':
              compressedStream = compressedStream.avif({ quality });
              break;
            default:
              console.warn("Unsupported format! Skipping compression...");
          }

          body = compressedStream;
          transformStream.pipe(compressedStream);
        } else {
          this._writeStream = new Transform({
            transform(chunk, encoding, callback) {
              callback(null, chunk)
            }
          })

          this._writeStream.on('error', error => {
            console.error(error);

            reject({
              message: error.message,
              code: error.code,
              httpCode: error.httpCode
            });
          });

          body = this._writeStream;
        }

        console.info(`Start upload file ${uuid()}.${formatFile} to S3 bucket...`)

        new Upload({
          client: new S3Client({
            credentials: { accessKeyId, secretAccessKey }, region
          }),
          params: {
            ACL: 'public-read',
            Bucket,
            Key: `${uuid()}.${formatFile}`,
            Body: body,
            ContentType: contentType == null ? "application/octet-stream" : contentType
          },
          tags: [], // optional tags
          partSize: partSize,
          queueSize: queueSize,
          leavePartsOnError: leavePartsOnError,
        })
          .done()
          .then(data => form.emit('data', data))
          .catch((error) => form.emit('error', error))
      }

      file.end = function (cb) {
        this._writeStream.on('finish', () => {
          this.emit('end')
          cb()
        })

        this._writeStream.end()
      }
    })
  })
}

module.exports = putFile;
