# gcp-cloudfunction-git-event

__[Google Cloud Function][1]__ to be called on Git repository events.
It gets the most recent version of the code (through `git clone`) and triggers __[Cloud Build][2]__
based on a configuration file expected to reside in the repository.

[![js-standard-style][3]][4] [![CircleCI][5]][6]

The main purpose here is to allow automatic __Cloud Build__ triggering even for Git repositories
that are not connectable through __[Source Repositories][7]__, such as __GitLab__ or on-premisses
hosted ones (_the repository **must** support webhooks or similar technology to call this
function_).

Present work is based on GitLab's [Joshua Lambert][8] enlightening __[cloud-function-trigger][9]__,
with some adjustments to make it more flexible:

1. leverage __Cloud Function__ environment variables;
1. use __[Secret Manager][10]__ instead of __[KMS][11]__;
1. trigger parent and child __Cloud Build__ jobs.

## Requirements

This function makes use of a few products:
1. An internet-reachable Git repository with webhook support, such as a __[gitlab.com][13]__
hosted one
1. __Google Cloud Function__
1. __Google Cloud Secret Manager__
1. __Google Cloud Build__

## Instructions

1. Copy `index.js` and `package.json` to a __Cloud Function__
1. Set function's [environment variables](#environment-variables) accordingly
1. Deploy the function
1. Grant your GCP project's _Cloud Build Service Account_ the `Secret Manager Secret Accessor`
IAM role.
1. Create a Git project that includes a `cloudbuild.yaml` file
1. Set up a [webhook][14] to trigger the Cloud Function on the desired events (push, tag, etc)
1. Create a [deploy token][15] for the project
1. Store the token in __Secret Manager__, formatted as `https://username:password@gitlab.com`
in case you're using GitLab
1. Push some code to the repository created in step 5 and _voilà_!

## Environment variables

The environment variables listed below are used by the function:

| NAME | DESCRIPTION | MANDATORY |
| ---- | ----------- | --------- |
| AUTH_HEADER_NAME | Name of the HTTP header that nust be provided to authorize the request. | Y |
| AUTH_HEADER_VALUE | Value of the HTTP header that nust be provided to authorize the request. | Y |
| CHILD_BUILD_CONFIG_FILE | The child __Cloud Build__ configuration file; defaults to `cloudbuild.yaml`. | N |
| CHILD_BUILD_SUBSTITUTIONS | Parameters to be substituted in the child build specification, in the format of `_SAMPLE_VALUE=blue,_OTHER_VALUE=10` ([build-requests#substitutions][12] for reference). | Y |
| CLOUDBUILD_PROJECT_ID | Id of a project to run the __Cloud Build__ jobs. | N |
| GIT_REPOSITORY_URL | URL of the repository to be cloned; must be provided if `GIT_REPOSITORY_URL_REQUEST_PATH` is not present. | N |
| GIT_REPOSITORY_URL_REQUEST_PATH | JSON path to extract the URL of the repository from the request body; takes priority over `GIT_REPOSITORY_URL`. | N |
| SECRET_NAME | Name of the secret used to store Git credentials in __Secret Manager__. | Y |
| SECRET_VERSION | Version of the secret used to store Git credentials in __Secret Manager__. | Y |

[1]: https://cloud.google.com/functions/
[2]: https://cloud.google.com/cloud-build/
[3]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[4]: http://standardjs.com
[5]: https://circleci.com/gh/ricardolsmendes/gcp-cloudfunction-git-event.svg?style=svg
[6]: https://circleci.com/gh/ricardolsmendes/gcp-cloudfunction-git-event
[7]: https://cloud.google.com/source-repositories/
[8]: https://gitlab.com/joshlambert
[9]: https://gitlab.com/joshlambert/cloud-function-trigger
[10]: https://cloud.google.com/secret-manager/
[11]: https://cloud.google.com/kms/
[12]: https://cloud.google.com/cloud-build/docs/api/build-requests#substitutions
[13]: https://gitlab.com
[14]: https://docs.gitlab.com/ee/user/project/integrations/webhooks.html
[15]: https://docs.gitlab.com/ee/user/project/deploy_tokens/
