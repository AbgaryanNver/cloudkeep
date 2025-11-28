const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  try {
    const userId = event.requestContext.authorizer.principalId;
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 50;
    const lastKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

    // Query files for user
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':active': 'active'
      },
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (lastKey) {
      params.ExclusiveStartKey = lastKey;
    }

    const result = await docClient.send(new QueryCommand(params));

    const files = result.Items.map(item => ({
      fileId: item.fileId,
      fileName: item.fileName,
      fileSize: item.fileSize,
      contentType: item.contentType,
      uploadDate: item.uploadDate,
      shared: item.shared || false
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files,
        count: files.length,
        lastKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null
      })
    };
  } catch (error) {
    console.error('List error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to list files', details: error.message })
    };
  }
};
