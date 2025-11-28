const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const fileId = uuidv4();

    // Parse file data from request
    const body = JSON.parse(event.body);
    const { fileName, fileContent, contentType, fileSize } = body;

    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing required fields: fileName, fileContent' })
      };
    }

    // Upload to S3
    const s3Key = `${userId}/${fileId}/${fileName}`;
    const buffer = Buffer.from(fileContent, 'base64');

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream'
    }));

    // Store metadata in DynamoDB
    const uploadDate = Date.now();
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        fileId,
        fileName,
        fileSize: fileSize || buffer.length,
        contentType: contentType || 'application/octet-stream',
        uploadDate,
        s3Key,
        status: 'active'
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'File uploaded successfully',
        fileId,
        fileName,
        uploadDate
      })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to upload file', details: error.message })
    };
  }
};
