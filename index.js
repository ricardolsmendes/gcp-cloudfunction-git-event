'use strict';

const jp = require('jsonpath');

const { CloudBuildClient } = require('@google-cloud/cloudbuild');

/**
 * HTTP Cloud Function to be called on Git repository event.
 *
 * @param {object} req The HTTP request.
 * @param {object} res The HTTP response.
 */
exports.triggerBuild = async (req, res) => {

  console.log('>> Starting to handle request:');
  console.log(req);

  // Authorize the request through a specific header.
  const authHeaderName = process.env.AUTH_HEADER_NAME;
  const expectedAuthHeaderValue = process.env.AUTH_HEADER_VALUE;
  const providedAuthHeaderValue = req.get(authHeaderName);
  if (providedAuthHeaderValue !== expectedAuthHeaderValue) {
    const errorMessage = [
      'Unauthorized request!',
      `Invalid ${process.env.AUTH_HEADER_KEY} header value: ${providedAuthHeaderValue}.`
    ].join(' ');
    console.log(`ERROR: ${errorMessage}`);
    res.status(401).send(errorMessage);
    return;
  }

  // Extract repository url from the request body or environment variable.
  const repositoryUrlRequestPath = process.env.GIT_REPOSITORY_URL_REQUEST_PATH;
  const repositoryUrl = repositoryUrlRequestPath ?
    jp.value(req.body, repositoryUrlRequestPath) : process.env.GIT_REPOSITORY_URL;

  // Make the Cloud Build specificagion object.
  const build = makeBuildSpecification(repositoryUrl);

  const createBuildRequest = {
    build: build
  };

  console.log(' . creating build');
  const [createBuildResponse] = await new CloudBuildClient()
    .createBuild(createBuildRequest);

  console.log('>> BUILD CREATED!');
  console.log(' > response:');
  console.log(createBuildResponse);

  res.status(200).send('Build successfully triggered!');
};

function makeBuildSpecification(repositoryUrl) {

  const buildSpec = Object.create(null);

  buildSpec.steps = [{
    name: 'gcr.io/cloud-builders/gcloud',
    args: [
      'beta',
      'secrets',
      'versions', 'access', process.env.SECRET_VERSION,
      '--secret', process.env.SECRET_NAME,
      '>', '.git-credentials'
    ]
  }, {
    name: 'gcr.io/cloud-builders/git',
    args: [
      'config',
      '--global', 'credential.helper', '\'store\''
    ]
  }, {
    name: 'gcr.io/cloud-builders/git',
    args: [
      'clone',
      '--depth', '1',
      repositoryUrl
    ]
  }, {
    name: 'gcr.io/cloud-builders/gcloud',
    args: [
      'builds',
      'submit',
      '.',
      '--config', process.env.CLOUD_BUILD_CONFIG_FILE || 'cloudbuild.yaml',
      '--substitutions', process.env.CLOUD_BUILD_SUBSTITUTIONS
    ]
  }];

  return buildSpec;
}
