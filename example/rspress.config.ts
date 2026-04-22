import { defineConfig } from "@rspress/core";
import { terminologyPlugin } from "../dist/server";
import path from "path";

export default defineConfig({
  root: "./docs",
  title: "Rspress Terminology Example",
  description: "Example project demonstrating @grnet/rspress-plugin-terminology",

  themeConfig: {
    title: "Rspress Terminology",
    logo: "/logo.svg",
    socialLinks: [
      {
        icon: "github",
        url: "https://github.com/grnet/rspress-plugin-terminology",
      },
    ],
  },

  plugins: [
    terminologyPlugin({
      termsDir: path.resolve(__dirname, "docs/terms"),
      docsDir: path.resolve(__dirname, "docs"),
      glossaryFilepath: path.resolve(__dirname, "docs/glossary.md"),
      // basePath: ''  // Uncomment if hosting in subdirectory
    }),
  ],

  // Rsbuild configuration to exclude server-only code from client bundle
  builderConfig: {
    tools: {
      rspack: (config: any) => {
        // Add externals to the config
        if (!config.externals) {
          config.externals = [];
        }
        // Add Node.js built-ins as externals
        config.externals.push(['fs', 'path', 'remark', 'remark-html']);
        return config;
      },
    },
  },
});
