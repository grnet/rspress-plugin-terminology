/**
 * Example RSPress Configuration with Debug Logging
 *
 * This file demonstrates how to configure the rspress-terminology plugin
 * with debug logging enabled.
 */

import { defineConfig } from '@rspress/core';
import { terminologyPlugin } from 'rspress-terminology';

// Basic configuration with debug enabled
export default defineConfig({
  plugins: [
    terminologyPlugin({
      // Required paths
      termsDir: 'docs/terms',
      docsDir: 'docs',
      glossaryFilepath: 'docs/glossary.md',

      // Debug configuration
      debug: true  // Enable all debug logs
    })
  ]
});

// Alternative: Advanced debug configuration
export default defineConfig({
  plugins: [
    terminologyPlugin({
      termsDir: 'docs/terms',
      docsDir: 'docs',
      glossaryFilepath: 'docs/glossary.md',

      // Advanced debug configuration
      debug: {
        enabled: true,
        timestamps: true,  // Include timestamps in logs
        namespaces: [      // Only log specific namespaces
          'plugin:*',      // All plugin operations
          'build:index'    // Term indexing operations
        ]
      }
    })
  ]
});

// Using environment variables instead
// Run with: RSPRESS_TERMINOLOGY_DEBUG=build:* npm run build
export default defineConfig({
  plugins: [
    terminologyPlugin({
      termsDir: 'docs/terms',
      docsDir: 'docs',
      glossaryFilepath: 'docs/glossary.md'
      // No debug config needed - controlled via environment variable
    })
  ]
});

// Example: Minimal debug configuration for production
export default defineConfig({
  plugins: [
    terminologyPlugin({
      termsDir: 'docs/terms',
      docsDir: 'docs',
      glossaryFilepath: 'docs/glossary.md',

      debug: {
        enabled: true,
        namespaces: ['plugin:build'],  // Only critical build events
        timestamps: false               // No timestamps for cleaner output
      }
    })
  ]
});
