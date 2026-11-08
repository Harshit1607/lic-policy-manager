// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyReleaseSigning } = require('./withReleaseSigning') as {
  applyReleaseSigning: (gradle: string) => string;
};

// Shape of the Expo/React Native template's android/app/build.gradle (abridged).
const TEMPLATE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            minifyEnabled false
        }
    }
}
`;

// Body of the first `name { ... }` block at the top nesting level of src.
function block(src: string, name: string): string {
  const open = new RegExp(`^${name.replace(/\./g, '\\.')}\\s*\\{`);
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    const m = depth === 0 && !/[\w.]/.test(src[i - 1] ?? '') ? open.exec(src.slice(i)) : null;
    if (m) {
      const start = i + m[0].length;
      let d = 1;
      let j = start;
      for (; d > 0; j++) {
        if (j >= src.length) throw new Error(`unbalanced ${name} block`);
        if (src[j] === '{') d++;
        else if (src[j] === '}') d--;
      }
      return src.slice(start, j - 1);
    }
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
  }
  throw new Error(`no ${name} block`);
}

const path = (src: string, ...names: string[]) => names.reduce(block, src);
const signingConfigOf = (buildType: string) =>
  /^\s*signingConfig\s+signingConfigs\.(\w+)\s*$/m.exec(buildType)?.[1];
const envVars = (src: string) =>
  [...src.matchAll(/System\.getenv\('(\w+)'\)/g)].map((m) => m[1]);

// README "Signing": the four variables that carry the permanent release key.
const LIC_VARS = ['LIC_KEYSTORE', 'LIC_KEYSTORE_PASSWORD', 'LIC_KEY_ALIAS', 'LIC_KEY_PASSWORD'];

describe('applyReleaseSigning', () => {
  const out = applyReleaseSigning(TEMPLATE);

  test('release build type signs with signingConfigs.release; debug keeps the debug key', () => {
    expect(signingConfigOf(path(out, 'android', 'buildTypes', 'release'))).toBe('release');
    expect(signingConfigOf(path(out, 'android', 'buildTypes', 'debug'))).toBe('debug');
    expect(path(out, 'android', 'buildTypes', 'release')).toMatch(/^\s*minifyEnabled false\s*$/m);
  });

  test('adds a release signing config read from the LIC_* env vars and keeps the debug one', () => {
    expect(new Set(envVars(path(out, 'android', 'signingConfigs', 'release')))).toEqual(new Set(LIC_VARS));
    expect(path(out, 'android', 'signingConfigs', 'debug')).toContain("storeFile file('debug.keystore')");
  });

  test('appends a top-level release-task guard that checks every LIC_* env var', () => {
    const guard = block(out, 'gradle.taskGraph.whenReady');
    expect(guard).toMatch(/throw new GradleException/);
    for (const v of LIC_VARS) expect(guard).toContain(`'${v}'`);
  });

  test('applying it twice changes nothing more than applying it once', () => {
    const once = applyReleaseSigning(TEMPLATE);
    expect(once).not.toBe(TEMPLATE);
    expect(applyReleaseSigning(once)).toBe(once);
  });

  test('refuses a template without a signingConfigs block instead of skipping signing', () => {
    const noSigning = TEMPLATE.replace(/ {4}signingConfigs \{[\s\S]*?\n {4}\}\n/, '');
    expect(() => applyReleaseSigning(noSigning)).toThrow(/signingConfigs/);
  });

  test('refuses a template whose release build type no longer uses the debug key', () => {
    const changed = TEMPLATE.replace(
      /(release \{\n[^\n]*\n\s*)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.other',
    );
    expect(() => applyReleaseSigning(changed)).toThrow(/release build type/);
  });
});
