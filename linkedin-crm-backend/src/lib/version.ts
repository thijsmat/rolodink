/**
 * The extension version the update notice compares against.
 *
 * This lived as a bare `const latestVersion = '1.3.3'` inside the
 * /api/version handler, with a comment asking whoever cut a release to keep it
 * in sync with the manifests. Nothing enforced that, and by the time v1.3.5
 * shipped it was two releases behind - so the endpoint told everyone on an
 * older build that 1.3.3 was the newest there was. An earlier release had the
 * same failure in a worse form: the value sat at 1.0.10 while 1.3.0 was live,
 * which is *older* than the shipped version, so the notice never fired at all.
 *
 * It is a module-level export now for two reasons: bump-version.sh has one
 * well-known line to rewrite, and version.test.ts can import the value and
 * fail the build when it drifts from the manifests. A comment asking for
 * discipline is not a mechanism.
 */
export const LATEST_EXTENSION_VERSION = '1.3.6';
