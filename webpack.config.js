const path = require('path');

module.exports = {
  // Keep existing config if any
  // ...
  
  // Add module rule to ignore warnings from Firebase source maps
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          // Exclude firebase packages from source-map-loader
          /node_modules\/@firebase/,
          /node_modules\/firebase/
        ],
      }
    ]
  },
  
  // Ignore specific warnings related to missing source maps
  ignoreWarnings: [
    {
      module: /node_modules\/@firebase\/firestore/,
    },
    {
      module: /node_modules\/firebase\/app/,
    },
    {
      module: /node_modules\/firebase\/firestore/,
    },
  ]
};
