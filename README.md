# gcp-cloudfunction-git-event

HTTP **[Cloud Function][1]** to be called on Git repository events.
It gets the most recent version of the code (through `git clone`) and triggers **[Cloud Build][2]**
relying upon a configuration file expected to reside in the repository.

[![js-standard-style][3]][4] [![CircleCI][5]][6]

The main purpose here is to allow automatic **Cloud Build** triggering even for Git repositories
that are not connectable through **[Source Repositories][7]**, such as **GitLab** or on-premisses
hosted ones (_the repository **must** support webhooks or similar technology to call this Cloud
Function_).

Present work is based on GitLab's **[Joshua Lambert][8]** enlightening [cloud-function-trigger][9],
with a few adjustments to make it more flexible:

1. leverage **Cloud Function** environment variables
1. use **[Secret Manager][10]** instead of **[KMS][11]**
1. trigger parent and child **Cloud Build** jobs

## Requirements

1. An internet-reachable Git repository with webhook support, such as a **[gitlab.com][13]**
   hosted one
1. Google **Cloud Function**
1. Google Cloud **Secret Manager**
1. Google **Cloud Build**

## Instructions for GitLab

1. Create a Git repository that includes a `cloudbuild.yaml` file
1. Create a [deploy token][14] for the project
1. Store the token in **Secret Manager**, formatted as `https://username:password@gitlab.com`
1. Grant your GCP project's _Cloud Build Service Account_ the `Secret Manager Secret Accessor`
   IAM role
1. Copy `index.js` and `package.json` to a **Cloud Function**
1. Set function's [environment variables](#environment-variables)
1. Deploy the **Cloud Function**
1. Set up a [webhook][15] to trigger the **Cloud Function** on the desired events (push, tag, etc)
1. Push some code to the repository created in step 1 and _voilà_!

## Environment variables

The environment variables listed below are used by the function:

| NAME                            | DESCRIPTION                                                                                                                                                                | MANDATORY |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| AUTH_HEADER_NAME                | Name of the HTTP header that must be provided to authorize the request.                                                                                                    |    Yes    |
| AUTH_HEADER_VALUE               | Value of the HTTP header that must be provided to authorize the request.                                                                                                   |    Yes    |
| CHILD_BUILD_CONFIG_FILE         | The _child build_ configuration file; defaults to `cloudbuild.yaml`.                                                                                                       |    No     |
| CHILD_BUILD_SUBSTITUTIONS       | Parameters to be substituted in the _child build_ specification, in the format of `_SAMPLE_VALUE=blue,_OTHER_VALUE=10` ([build configuration overview][12] for reference). |    Yes    |
| CLOUDBUILD_PROJECT_ID           | Id of a project to run the **Cloud Build** jobs.                                                                                                                           |    No     |
| GIT_REPOSITORY_URL              | URL of the repository to be cloned; must be provided if `GIT_REPOSITORY_URL_REQUEST_PATH` is not present.                                                                  |    No     |
| GIT_REPOSITORY_URL_REQUEST_PATH | JSON path to extract the URL of the repository from the request body; takes priority over `GIT_REPOSITORY_URL`.                                                            |    No     |
| SECRET_NAME                     | Name of the secret used to store Git credentials in **Secret Manager**.                                                                                                    |    Yes    |
| SECRET_VERSION                  | Version of the secret used to store Git credentials in **Secret Manager**.                                                                                                 |    No     |

## How to contribute

Please make sure to take a moment and read the [Code of
Conduct](https://github.com/ricardolsmendes/gcp-cloudfunction-git-event/blob/master/.github/CODE_OF_CONDUCT.md).

### Report issues

Please report bugs and suggest features via the [GitHub
Issues](https://github.com/ricardolsmendes/gcp-cloudfunction-git-event/issues).

Before opening an issue, search the tracker for possible duplicates. If you find a duplicate, please
add a comment saying that you encountered the problem as well.

### Contribute code

Please make sure to read the [Contributing
Guide](https://github.com/ricardolsmendes/gcp-cloudfunction-git-event/blob/master/.github/CONTRIBUTING.md)
before making a pull request.

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
[12]: https://cloud.google.com/cloud-build/docs/build-config#substitutions
[13]: https://gitlab.com
[14]: https://docs.gitlab.com/ee/user/project/deploy_tokens/
[15]: https://docs.gitlab.com/ee/user/project/integrations/webhooks.html
