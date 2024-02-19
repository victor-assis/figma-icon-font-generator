import esbuild from 'esbuild';

// Basic options
const options = {
  // Entry points and the path to the final bundle
  entryPoints: ['plugin/index.ts'],
  outdir: 'dist/plugin',

  // Whether to bundle together, minify and add a source map
  bundle: true,
  minify: true,
  sourcemap: true,

  loader: {
    '.svg': 'text',
  },

  // A target environment (esbuild doesn’t support this option specified in tsconfig.json)
  target: 'es6',

  // Log level is specified in order to print basic information even when esbuild launched as an npm script from package.json
  logLevel: 'info',

  // define: {
  //   'process.env.EXAMPLE_API_KEY': JSON.stringify(process.env.EXAMPLE_API_KEY),
  //   'process.env.NODE_ENV': '"production"'
  // }
};

// Different types of builds
const configs = {
  // The default one. Builds right away
  build: () => esbuild.build(options),

  // The watching one. Sets the context first and starts the watchg process later
  watch: () => esbuild.context(options).then((r) => r.watch()),
};

/*
Run the config. A command of the type `node esbuild.js watch` should be used. The third element of the command will be treated as a config name
*/
await configs[process.argv[2]]().catch((e) => {
  console.error(e);
  process.exit(1);
});
