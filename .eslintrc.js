module.exports = {
  extends: [
    'eslint:recommended',
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        jsxSingleQuote: true,
      },
    ],
    'func-call-spacing': 'error',
    '@typescript-eslint/func-call-spacing': 'off',
    quotes: 'off',
    'jsx-quotes': ['warn', 'prefer-single'],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-shadow': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
  ],
};
