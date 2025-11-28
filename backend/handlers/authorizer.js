exports.handler = async (event) => {
  try {
    const token = event.authorizationToken;

    if (!token) {
      throw new Error('Unauthorized');
    }

    // Extract token from "Bearer <token>" format
    const tokenValue = token.replace('Bearer ', '');

    // Simple token validation (in production, use JWT verification)
    // For demo purposes, accept any token that starts with "cloudkeep-"
    if (!tokenValue.startsWith('cloudkeep-')) {
      throw new Error('Unauthorized');
    }

    // Extract userId from token (in production, decode from JWT)
    const userId = tokenValue.replace('cloudkeep-', '') || 'demo-user';

    // Generate IAM policy
    return generatePolicy(userId, 'Allow', event.methodArn);
  } catch (error) {
    console.error('Authorization error:', error);
    throw new Error('Unauthorized');
  }
};

function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId
  };

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    };
    authResponse.policyDocument = policyDocument;
  }

  // Optional: Add additional context
  authResponse.context = {
    userId: principalId,
    timestamp: new Date().toISOString()
  };

  return authResponse;
}
