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

  console.log('>> Starting to handle a request...');

  // Extract authorization credentials from a specific HTTP header.
  const { AUTH_HEADER_NAME } = process.env;
  const { AUTH_HEADER_VALUE } = process.env;
  const providedCredentials = req.get(AUTH_HEADER_NAME);
  if (!providedCredentials || providedCredentials !== AUTH_HEADER_VALUE) {
    const errorMessage = `Unauthorized request! Invalid ${AUTH_HEADER_NAME} header value.`;
    console.log(`ERROR: ${errorMessage}`);
    res.status(401).send(errorMessage);
    return;
  }

  // Extract repository url from the request body or environment variable.
  const { GIT_REPOSITORY_URL_REQUEST_PATH } = process.env;
  const repositoryUrl = GIT_REPOSITORY_URL_REQUEST_PATH ?
    jp.value(req.body, GIT_REPOSITORY_URL_REQUEST_PATH) : process.env.GIT_REPOSITORY_URL;

  // Create the master Cloud Build request.
  const createBuildRequest = {
    projectId: process.env.CLOUDBUILD_PROJECT_ID,
    build: makeBuildSpecification(repositoryUrl)
  };

  console.log(' . creating build');
  const [createBuildResponse] = await new CloudBuildClient()
    .createBuild(createBuildRequest);

  console.log('>> BUILD CREATED!');
  console.log(`>> ID: ${createBuildResponse.metadata.build.id}`);

  res.status(200).send('Build successfully triggered!');
};

function makeBuildSpecification(repositoryUrl) {

  const buildSpec = Object.create(null);

  buildSpec.steps = [{
    name: 'gcr.io/cloud-builders/gcloud',
    entrypoint: '/bin/bash',
    args: [
      '-c',
      [
        'gcloud components update &&', // TODO: remove after gcr.io/cloud-builders/gcloud update...
        'gcloud beta', // TODO: remove `beta` after the service turns GA...
        'secrets',
        `versions access ${process.env.SECRET_VERSION}`,
        `--secret ${process.env.SECRET_NAME}`,
        '> .git-credentials'
      ].join(' ')
    ]
  }, {
    name: 'gcr.io/cloud-builders/git',
    args: [
      'config',
      '--global', 'credential.helper', '\'store\''
    ],
    env: ['HOME=/workspace']
  }, {
    name: 'gcr.io/cloud-builders/git',
    args: [
      'clone',
      '--depth', '1',
      repositoryUrl,
      './git-contents'
    ],
    env: ['HOME=/workspace']
  }, {
    name: 'gcr.io/cloud-builders/gcloud',
    args: [
      'builds',
      'submit',
      './git-contents',
      '--config',
      `./git-contents/${process.env.CHILD_BUILD_CONFIG_FILE || 'cloudbuild.yaml'}`,
      '--substitutions', process.env.CHILD_BUILD_SUBSTITUTIONS
    ]
  }];

  return buildSpec;
}
