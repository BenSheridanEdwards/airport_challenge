// Set the global Jest test timeout to 30000 ms (30 seconds)
jest.setTimeout(30000);

if (!process.env.TEST_MODE) {
  require('source-map-support').install();
}
