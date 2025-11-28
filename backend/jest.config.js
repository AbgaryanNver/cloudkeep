module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'handlers/**/*.js',
    'index.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  testTimeout: 10000
};
