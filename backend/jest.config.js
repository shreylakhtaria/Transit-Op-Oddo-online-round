export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '(.*/)?config/database\\.js$': '<rootDir>/__mocks__/database.js',
    '(.*/)?config/mailer\\.js$': '<rootDir>/__mocks__/mailer.js',
  },
};
