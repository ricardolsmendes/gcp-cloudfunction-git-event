'use strict';

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
    '--depth', '1',
    process.env.GIT_REPOSITORY_HTTP_ADDRESS
  ]
}, {
  name: 'gcr.io/cloud-builders/gcloud',
  args: [
    'builds',
    'submit',
    '.'
  ]
}];

/**
 * Background Cloud Function to be triggered by an HTTP request.
 *
 * @param {object} req The HTTP request.
 * @param {object} res The HTTP response.
 */
exports.get = async (req, res) => {

  const cloudBuild = new CloudBuildClient();

  const createBuildRequest = {
    build: build
  };

  await cloudBuild.createBuild(createBuildRequest);

  res.status(200).send('Build successfully triggered!');
};
