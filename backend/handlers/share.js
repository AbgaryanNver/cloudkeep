const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({});
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const fileId = event.pathParameters.fileId;
    const body = JSON.parse(event.body || '{}');
    const expiresIn = body.expiresIn || 86400; // Default 24 hours

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

    // Get file metadata
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

    // Generate shareable presigned URL
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileMetadata.s3Key
    });

    const shareUrl = await getSignedUrl(s3Client, command, { expiresIn });

    // Update file metadata to mark as shared
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, fileId },
      UpdateExpression: 'SET shared = :shared, lastSharedAt = :lastSharedAt',
      ExpressionAttributeValues: {
        ':shared': true,
        ':lastSharedAt': Date.now()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Share link generated successfully',
        shareUrl,
        fileName: fileMetadata.fileName,
        expiresIn,
        expiresAt: Date.now() + (expiresIn * 1000)
      })
    };
  } catch (error) {
    console.error('Share error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to generate share link', details: error.message })
    };
  }
};
