'use strict';

const jp = require('jsonpath');

const { CloudBuildClient } = require('@google-cloud/cloudbuild');

const build = Object.create();
build.steps = [{
  name: 'gcr.io/cloud-builders/gsutil',
  args: [
    'cp',
    `${process.env.GIT_CREDENTIALS_BUCKET}/*`,
    '.'
  ]
}, {
  name: 'gcr.io/cloud-builders/gcloud',
  args: [
    'kms',
    'decrypt',
    '--ciphertext-file', '.git-credentials.enc',
    '--plaintext-file', '.git-credentials',
    '--location', process.env.KMS_DECRYPT_LOCATION,
    '--key', process.env.KMS_KEY,
    '--keyring', process.env.KMS_KEY_RING
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
    '--depth', '1'
  ]
}, {
  name: 'gcr.io/cloud-builders/gcloud',
  args: [
    'builds',
    'submit',
    '--config', process.env.CLOUD_BUILD_CONFIG_FILE,
    '.'
  ]
}];

/**
 * Background Cloud Function to be triggered by an HTTP request.
 *
 * @param {object} req The HTTP request.
 * @param {object} res The HTTP response.
 */
exports.triggerBuild = async (req, res) => {

  console.log('>> Starting to handle request:');
  console.log(req);

  // TODO: Validate Secret Token

  const repositoryUrl = process.env.GIT_REPOSITORY_URL ?
    process.env.GIT_REPOSITORY_URL :
    jp.value(req, process.env.GIT_REPOSITORY_URL_REQUEST_PATH);

  // Append the repository url to the `git clone` command.
  build.steps[3].args.push(repositoryUrl);

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
