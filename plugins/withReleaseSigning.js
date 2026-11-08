/**
 * Expo config plugin: sign Android release builds with the app's permanent
 * release key instead of the debug key.
 *
 * The key is never committed. Release builds read it from four environment
 * variables (see README "Signing"):
 *   LIC_KEYSTORE           absolute path to the release keystore file
 *   LIC_KEYSTORE_PASSWORD  keystore password
 *   LIC_KEY_ALIAS          key alias inside the keystore
 *   LIC_KEY_PASSWORD       key password
 * A release build (assemble/bundle/package/install/sign *Release) fails with a
 * clear message when any of them is missing or the keystore file does not
 * exist, so a release APK can never silently fall back to the debug key.
 * Debug builds are unchanged.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @lic-release-signing';

const RELEASE_SIGNING_CONFIG = `        release { ${MARKER}
            // Permanent release key from LIC_* environment variables; never committed.
            def licKeystore = System.getenv('LIC_KEYSTORE')
            if (licKeystore) {
                storeFile file(licKeystore)
                storePassword System.getenv('LIC_KEYSTORE_PASSWORD')
                keyAlias System.getenv('LIC_KEY_ALIAS')
                keyPassword System.getenv('LIC_KEY_PASSWORD')
            }
        }
`;

const RELEASE_GUARD = `
${MARKER} guard: release builds must be signed with the permanent key.
gradle.taskGraph.whenReady { graph ->
    def releaseTask = graph.allTasks.find { t ->
        t.project == project && t.name ==~ /^(assemble|bundle|package|install|sign)Release.*/
    }
    if (releaseTask != null) {
        def required = ['LIC_KEYSTORE', 'LIC_KEYSTORE_PASSWORD', 'LIC_KEY_ALIAS', 'LIC_KEY_PASSWORD']
        def missing = required.findAll { !System.getenv(it) }
        if (!missing.isEmpty()) {
            throw new GradleException(
                "Release signing is not configured: set " + missing.join(', ') +
                " to the permanent release keystore (see README, 'Signing'). " +
                "Refusing to sign a release build with the debug key.")
        }
        if (!file(System.getenv('LIC_KEYSTORE')).exists()) {
            throw new GradleException(
                "Release signing: LIC_KEYSTORE points to " + System.getenv('LIC_KEYSTORE') +
                ", which does not exist.")
        }
    }
}
`;

/**
 * Rewrite the generated android/app/build.gradle so release builds use the
 * release signing config and refuse to build without the key. Idempotent.
 * Throws when the template no longer has the expected shape, so a template
 * change can never silently drop release signing.
 */
function applyReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const signingConfigs = /(\n\s*signingConfigs\s*\{\n)/;
  if (!signingConfigs.test(gradle)) {
    throw new Error('withReleaseSigning: no signingConfigs block found in app/build.gradle');
  }
  let out = gradle.replace(signingConfigs, `$1${RELEASE_SIGNING_CONFIG}`);

  // Inside buildTypes { release { ... } }, swap the debug signing config
  // (and the template's "generate your own keystore" comment) for release.
  const releaseUsesDebug = /(buildTypes\s*\{[\s\S]*?\n(\s*)release\s*\{\n)(?:\s*\/\/[^\n]*\n)*\s*signingConfig signingConfigs\.debug\n/;
  if (!releaseUsesDebug.test(out)) {
    throw new Error('withReleaseSigning: release build type does not use signingConfigs.debug as expected');
  }
  out = out.replace(releaseUsesDebug, (_m, head, indent) => `${head}${indent}    signingConfig signingConfigs.release\n`);

  return out + RELEASE_GUARD;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withReleaseSigning: only the Groovy app/build.gradle is supported');
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
}

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
