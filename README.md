#### Configure

Paste your environment variables in the file .env

````bash
PORT=3000
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_REGION=
S3_BUCKET=
````

These key`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` can be found here:

1. Open the `AWS Console`
2. Click on your username near the top right and select `Security Credentials`
3. Find `Access Key` section
4. Click `Create Access Key`
5. Click Show User Security Credentials

Variables `S3_REGION` and `S3_BUCKET`:

1. Create S3 bucket by [instruction](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html)
2. Copy Region and bucket name which were specified during the Amazon S3 Bucket creation process

#### Run App in docker

1. Run script `run-script.sh`
2. Open browser and follow this link `http://localhost:80`