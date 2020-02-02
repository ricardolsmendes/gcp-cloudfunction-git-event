# gcp-cloudfunction-git-event

__[Google Cloud Function][1]__ to be triggered on Git repository events.

It clones the repository and creates a __[Cloud Build][2]__ based on a `cloudbuild.yaml` file
expected to reside in the repository.

_P.S.: The caller repository must support webhooks or similar technology._

[1]: https://cloud.google.com/functions/
[2]: https://cloud.google.com/cloud-build/
