const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');

describe(`navigationPreload.enable`, function() {
  const staticPath = `/test/workbox-navigation-preload/static/`;
  const baseUrl = global.__workbox.server.getAddress() + staticPath;
  const integrationUrl = `${baseUrl}integration.html`;
  const integrationUrlPath = `${staticPath}integration.html`;

  let requestCounter;
  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, integrationUrl);
    requestCounter = global.__workbox.server.startCountingRequests('Service-Worker-Navigation-Preload');
  });
  afterEach(function() {
    global.__workbox.server.stopCountingRequests(requestCounter);
  });

  it(`should make a network request if navigation preload is supported`, async function() {
    await activateAndControlSW(`${baseUrl}sw-default-header.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    expect(requestCounter.getUrlCount(integrationUrlPath)).to.eql(0);

    await global.__workbox.webdriver.get(integrationUrl);

    // If navigation preload is enabled, there should be 1 request. Otherwise,
    // no requests.
    expect(requestCounter.getUrlCount(integrationUrlPath)).to.eql(isEnabled ? 1 : 0);

    // Check to make sure that the correct header value was sent if navigation
    // preload is enabled.
    expect(requestCounter.getHeaderCount('true')).to.eql(isEnabled ? 1 : 0);
  });

  it(`should make a network request if navigation preload is supported, with a custom header value`, async function() {
    await activateAndControlSW(`${baseUrl}sw-custom-header.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    expect(requestCounter.getUrlCount(integrationUrlPath)).to.eql(0);

    await global.__workbox.webdriver.get(integrationUrl);

    // If navigation preload is enabled, there should be 1 request. Otherwise,
    // no requests.
    expect(requestCounter.getUrlCount(integrationUrlPath)).to.eql(isEnabled ? 1 : 0);

    // Check to make sure that the correct header value was sent if navigation
    // preload is enabled.
    expect(requestCounter.getHeaderCount('custom-value')).to.eql(isEnabled ? 1 : 0);

    // There shouldn't be any requests with the default header value, 'true'.
    expect(requestCounter.getHeaderCount('true')).to.eql(0);
  });
});
