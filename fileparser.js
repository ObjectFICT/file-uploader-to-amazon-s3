const formidable = require('formidable');
const Transform = require('stream').Transform;
const { Upload } = require("@aws-sdk/lib-storage");
const { S3Client } = require("@aws-sdk/client-s3");
const { uuid } = require('uuidv4');
const config = require('config')

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;

const maxFileSize = config.get('maxFileSize') * 1024 * 1024; //100 MBs converted to bytes
const allowEmptyFiles = config.get('allowEmptyFiles');
const queueSize = config.get('queueSize'); // optional concurrency configuration
const partSize = config.get('partSize') * 1024 * 1024; // optional size of each part, in bytes, at least 5MB
const leavePartsOnError = config.get('leavePartsOnError'); // optional manually handle dropped parts

const
  fileParser = async (req) => {
    return new Promise((resolve, reject) => {
      let options = {
        maxFileSize: maxFileSize,
        allowEmptyFiles: allowEmptyFiles
      }

      const form = formidable(options);

      form.parse(req, (err, fields, files) => {
      });

      form.on('error', error => reject(error.message));

      form.on('data', data => {
        if (data.name === "successUpload") {
          resolve(data.value);
        }
      })

      form.on('fileBegin', (formName, file) => {

        file.open = async function () {

          this._writeStream = new Transform({
            transform(chunk, encoding, callback) {
              callback(null, chunk)
            }
          })

          this._writeStream.on('error', err => {
            resolve({ error: err })
          });

          const spitedOriginalFileName = this.originalFilename.split('.');
          const formatFile = spitedOriginalFileName[spitedOriginalFileName.length - 1];
          // upload to S3
          new Upload({
            client: new S3Client({
              credentials: { accessKeyId, secretAccessKey }, region
            }),
            params: {
              ACL: 'public-read',
              Bucket,
              Key: `${uuid()}.${formatFile}`,
              Body: this._writeStream
            },
            tags: [], // optional tags
            partSize: partSize,
            queueSize: queueSize,
            leavePartsOnError: leavePartsOnError,
          })
            .done()
            .then(data => {
              console.log(data)
              resolve({
                statusCode: data.$metadata.httpStatusCode,
                post_uuid: data.Key,
                s3_bucket_retrieval_link: data.Location
              })
            }).catch((err) => {
            resolve({
              error: err
            })
          })
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

module.exports = fileParser;