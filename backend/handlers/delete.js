const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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

    // Delete from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileMetadata.s3Key
    }));

    // Soft delete in DynamoDB (mark as deleted)
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId, fileId },
      UpdateExpression: 'SET #status = :deleted, deletedAt = :deletedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':deleted': 'deleted',
        ':deletedAt': Date.now()
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'File deleted successfully',
        fileId,
        fileName: fileMetadata.fileName
      })
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to delete file', details: error.message })
    };
  }
};
