const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Configure the verifier
const verifier = process.env.USER_POOL_ID ? CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.USER_POOL_CLIENT_ID,
}) : null;

exports.handler = async (event) => {
  try {
    const token = event.authorizationToken;

    if (!token) {
      throw new Error('Unauthorized');
    }

    // Extract token from "Bearer <token>" format
    const tokenValue = token.replace('Bearer ', '');

    // For development/testing: Simple token validation
    if (process.env.NODE_ENV === 'development' && tokenValue.startsWith('cloudkeep-')) {
      const userId = tokenValue.replace('cloudkeep-', '') || 'demo-user';
      return generatePolicy(userId, 'Allow', event.methodArn);
    }

    // Production: Verify Cognito JWT token
    if (verifier) {
      try {
        const payload = await verifier.verify(tokenValue);
        const userId = payload.sub || payload.username;
        return generatePolicy(userId, 'Allow', event.methodArn);
      } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error('Unauthorized');
      }
    } else {
      // Fallback for simple token validation
      if (!tokenValue.startsWith('cloudkeep-')) {
        throw new Error('Unauthorized');
      }
      const userId = tokenValue.replace('cloudkeep-', '') || 'demo-user';
      return generatePolicy(userId, 'Allow', event.methodArn);
    }
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
