// jest.config.js
export default {
  // extensionsToTreatAsEsm: ['.js'],
  transform: {},
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  globalSetup: './tests/globalSetup.js', // Optional for DB
};