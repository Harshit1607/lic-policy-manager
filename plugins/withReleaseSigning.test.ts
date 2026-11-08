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

describe('applyReleaseSigning', () => {
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
