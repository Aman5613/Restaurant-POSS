import sharedConfig from '@pos/eslint-config';

export default [
  ...sharedConfig,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
