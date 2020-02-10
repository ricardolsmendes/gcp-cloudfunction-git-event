'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { CloudBuildClient } = require('@google-cloud/cloudbuild');

const { triggerBuild } = require('./index');

describe('triggerBuild', () => {

  const res = {
    status: sinon.stub().returnsThis(),
    send: sinon.stub()
  };

  var consoleLogStub;
  var createBuildStub;

  before(() => {
    consoleLogStub = sinon.stub(console, 'log');
  });

  beforeEach(() => {
    createBuildStub = sinon.stub(CloudBuildClient.prototype, 'createBuild').resolves([
      { id: 'Test Build' }
    ]);
  });

  it('returns a promise', () => {
    process.env.AUTH_HEADER_NAME = 'testAuthHeaderName';
    process.env.AUTH_HEADER_VALUE = 'testAuthHeaderValue';

    const req = {
      body: {},
      get: sinon.stub().returns('testAuthHeaderValue')
    };

    const triggerBuildReturn = triggerBuild(req, res);
    assert.strictEqual(Object.prototype.toString.call(triggerBuildReturn),
      '[object Promise]');
  });

  it('extracts repository url from the request body', () => {
    process.env.AUTH_HEADER_NAME = 'testAuthHeaderName';
    process.env.AUTH_HEADER_VALUE = 'testAuthHeaderValue';
    process.env.GIT_REPOSITORY_URL_REQUEST_PATH = '$.repository.git_http_url';

    const req = {
      body: {
        repository: {
          git_http_url: 'http://example.com/user/test.git',
        }
      },
      get: sinon.stub().returns('testAuthHeaderValue')
    };

    triggerBuild(req, res);
    const buildSpec = createBuildStub.getCall(0).args[0].build;
    const gitCloneStep = buildSpec.steps[2];

    assert.strictEqual(gitCloneStep.args[3], 'http://example.com/user/test.git');
  });

  afterEach(() => {
    createBuildStub.restore();

    delete process.env.AUTH_HEADER_NAME;
    delete process.env.AUTH_HEADER_VALUE;
    delete process.env.GIT_REPOSITORY_URL_REQUEST_PATH;
  });

  after(() => {
    consoleLogStub.restore();
  });

});
