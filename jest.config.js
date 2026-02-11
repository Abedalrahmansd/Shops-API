// jest.config.js
export default {
  // extensionsToTreatAsEsm: ['.js'],
  transform: {},
  testEnvironment: 'node',
  testTimeout: 15000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  globalSetup: './tests/globalSetup.js', // Optional for DB
};