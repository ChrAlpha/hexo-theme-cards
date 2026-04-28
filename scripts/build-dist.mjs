import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import autoprefixer from 'autoprefixer';
import CleanCSS from 'clean-css';
import postcss from 'postcss';
import stylus from 'stylus';
import { minify as minifyJs } from 'terser';

const AUTOPREFIXER_OPTIONS = {
  overrideBrowserslist: [
    'last 2 versions',
    '> 1%',
    'Chrome >= 40',
    'Firefox >= 40',
    'ie >= 10',
    'Safari >= 8'
  ]
};

const CLEAN_CSS_OPTIONS = {
  compatibility: 'ie10'
};

const JS_MINIFY_OPTIONS = {
  toplevel: true
};

const HEXO_CONFIG_PATTERNS = [
  [/convert\((.*?)\) \|\|\ /g, ''],
  [/hexo-config\((.*?)\)/g, '']
];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(SCRIPT_DIR, '..');
const SOURCE_DIR = join(ROOT_DIR, 'source');
const DIST_DIR = join(ROOT_DIR, 'dist');

function hasPrivatePathSegment(filePath) {
  return filePath.split(sep).some((segment) => segment.startsWith('_'));
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function ensureParentDirectory(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

function stripHexoConfig(source) {
  return HEXO_CONFIG_PATTERNS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    source
  );
}

async function createPreprocessedSourceTree(tempSourceDir) {
  const sourceFiles = await walkFiles(SOURCE_DIR);
  const styleFiles = sourceFiles.filter((filePath) => {
    const extension = extname(filePath);
    return extension === '.styl' || extension === '.css';
  });

  for (const sourceFile of styleFiles) {
    const relativePath = relative(SOURCE_DIR, sourceFile);
    const targetFile = join(tempSourceDir, relativePath);
    const original = await readFile(sourceFile, 'utf8');

    await ensureParentDirectory(targetFile);
    await writeFile(targetFile, stripHexoConfig(original));
  }
}

async function runAutoprefixer(css) {
  const result = await postcss([autoprefixer(AUTOPREFIXER_OPTIONS)]).process(css, {
    from: undefined
  });

  return result.css;
}

function minifyCss(css, sourcePath) {
  const result = new CleanCSS(CLEAN_CSS_OPTIONS).minify(css);

  if (result.errors.length > 0) {
    throw new Error(`CleanCSS failed for ${sourcePath}: ${result.errors.join('; ')}`);
  }

  return result.styles;
}

async function writeCssArtifacts(relativePath, css) {
  const outputFile = join(DIST_DIR, relativePath);
  const minifiedFile = outputFile.replace(/\.css$/, '.min.css');

  await ensureParentDirectory(outputFile);
  await writeFile(outputFile, css);
  await writeFile(minifiedFile, minifyCss(css, relativePath));
}

async function compileStylusFiles(tempSourceDir) {
  const sourceFiles = await walkFiles(SOURCE_DIR);
  const stylusFiles = sourceFiles.filter((filePath) => {
    if (extname(filePath) !== '.styl') {
      return false;
    }

    const relativePath = relative(SOURCE_DIR, filePath);
    return !hasPrivatePathSegment(relativePath);
  });

  for (const sourceFile of stylusFiles) {
    const relativePath = relative(SOURCE_DIR, sourceFile);
    const tempFile = join(tempSourceDir, relativePath);
    const stylusSource = await readFile(tempFile, 'utf8');
    const compiledCss = await new Promise((resolveCss, rejectCss) => {
      stylus(stylusSource)
        .set('filename', tempFile)
        .set('include css', true)
        .render((error, css) => {
          if (error) {
            rejectCss(error);
            return;
          }

          resolveCss(css);
        });
    });

    const prefixedCss = await runAutoprefixer(compiledCss);
    await writeCssArtifacts(relativePath.replace(/\.styl$/, '.css'), prefixedCss);
  }
}

async function processCssFiles() {
  const sourceFiles = await walkFiles(SOURCE_DIR);
  const cssFiles = sourceFiles.filter((filePath) => {
    if (extname(filePath) !== '.css') {
      return false;
    }

    const relativePath = relative(SOURCE_DIR, filePath);
    return !hasPrivatePathSegment(relativePath);
  });

  for (const sourceFile of cssFiles) {
    const relativePath = relative(SOURCE_DIR, sourceFile);
    const css = await readFile(sourceFile, 'utf8');
    const prefixedCss = await runAutoprefixer(css);

    await writeCssArtifacts(relativePath, prefixedCss);
  }
}

async function processJsFiles() {
  const sourceFiles = await walkFiles(SOURCE_DIR);
  const jsFiles = sourceFiles.filter((filePath) => {
    if (extname(filePath) !== '.js') {
      return false;
    }

    const relativePath = relative(SOURCE_DIR, filePath);
    return !hasPrivatePathSegment(relativePath);
  });

  for (const sourceFile of jsFiles) {
    const relativePath = relative(SOURCE_DIR, sourceFile);
    const outputFile = join(DIST_DIR, relativePath);
    const minifiedFile = outputFile.replace(/\.js$/, '.min.js');
    const source = await readFile(sourceFile, 'utf8');
    const minified = await minifyJs(source, JS_MINIFY_OPTIONS);

    if (!minified.code) {
      throw new Error(`Terser produced no output for ${relativePath}`);
    }

    await ensureParentDirectory(outputFile);
    await writeFile(outputFile, source);
    await writeFile(minifiedFile, minified.code);
  }
}

async function main() {
  await rm(DIST_DIR, { force: true, recursive: true });

  const tempRoot = await mkdtemp(join(tmpdir(), 'hexo-theme-cards-'));
  const tempSourceDir = join(tempRoot, 'source');

  try {
    await createPreprocessedSourceTree(tempSourceDir);
    await compileStylusFiles(tempSourceDir);
    await processCssFiles();
    await processJsFiles();
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
