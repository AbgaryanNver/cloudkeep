// Mock aws-jwt-verify before requiring the authorizer
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn(() => ({
      verify: jest.fn()
    }))
  }
}));

const authorizer = require('../handlers/authorizer');

describe('CloudKeep Backend Tests', () => {
  beforeEach(() => {
    // Set development environment for tests
    process.env.NODE_ENV = 'development';
  });

  describe('Authorizer', () => {
    test('should reject requests without authorization token', async () => {
      const event = {
        authorizationToken: null,
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/files'
      };

      await expect(authorizer.handler(event)).rejects.toThrow('Unauthorized');
    });

    test('should reject invalid tokens', async () => {
      const event = {
        authorizationToken: 'Bearer invalid-token',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/files'
      };

      await expect(authorizer.handler(event)).rejects.toThrow('Unauthorized');
    });

    test('should accept valid tokens', async () => {
      const event = {
        authorizationToken: 'Bearer cloudkeep-testuser',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/files'
      };

      const result = await authorizer.handler(event);

      expect(result).toBeDefined();
      expect(result.principalId).toBe('testuser');
      expect(result.policyDocument).toBeDefined();
      expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
    });

    test('should include context in authorization response', async () => {
      const event = {
        authorizationToken: 'Bearer cloudkeep-contextuser',
        methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/prod/GET/files'
      };

      const result = await authorizer.handler(event);

      expect(result.context).toBeDefined();
      expect(result.context.userId).toBe('contextuser');
      expect(result.context.timestamp).toBeDefined();
    });
  });

  describe('API Health', () => {
    test('should have valid package.json', () => {
      const packageJson = require('../package.json');

      expect(packageJson.name).toBe('cloudkeep-backend');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
    });
  });
});
