const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const fileId = event.pathParameters.fileId;

    if (!fileId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing fileId parameter' })
      };
    }

    // Get file metadata from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId, fileId }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'File not found' })
      };
    }

    const fileMetadata = result.Item;

    // Generate presigned URL for download
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileMetadata.s3Key
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        downloadUrl: presignedUrl,
        fileName: fileMetadata.fileName,
        fileSize: fileMetadata.fileSize,
        contentType: fileMetadata.contentType,
        expiresIn: 3600
      })
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to generate download URL', details: error.message })
    };
  }
};
