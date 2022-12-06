"use strict";

const os = require('os');

module.exports = {
  meta: {
    type: null, // `problem`, `suggestion`, or `layout`
    docs: {
      description: "feature sliced relative paths",
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    fixable: null, // Or `code` or `whitespace`
    schema: [], // Add a schema if the rule has options
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        // app/entities/Article
        const importTo = node.source.value;

        // /Users/nikolay/Documents/projects/ulbi-course/src/entities/Article
        const fromFilename = context.getFilename();

        if (shouldBeRelative(fromFilename, importTo)) {
          context.report({ node, message: 'Within a single slice, all paths must be relative' });
        }
      }
    };
  },
};

function isPathRelative(path) {
  return path === '.' || path.startsWith('./') || path.startsWith('../');
}

function isSharedToShared(from, to) {
  const fromLayer = getLayer(from);
  const toLayer = getLayer(to);

  return toLayer === 'shared' && fromLayer === 'shared';
}

const layers = {
  'entities': 'entities',
  'features': 'features',
  'shared': 'shared',
  'widgets': 'widgets',
  'pages': 'pages',
}

function shouldBeRelative(from, to) {
  const projectFrom = from.split('src')[1];

  if (!projectFrom) {
    return false;
  }

  if (isPathRelative(to) || isSharedToShared(projectFrom, to)) {
    return false;
  }

  // entities/Article
  const toLayer = getLayer(to);
  const toSlice = getSlice(to);

  if (!toLayer || !toSlice || !layers[toLayer]) {
    return false;
  }

  // /Users/nikolay/Documents/projects/ulbi-course/src/entities/Article
  const fromLayer = getLayer(projectFrom);
  const fromSlice = getSlice(projectFrom);

  if (!fromLayer || !fromSlice || !layers[fromLayer]) {
    return false;
  }

  return fromSlice === toSlice && toLayer === fromLayer;
}

function getLayer(path) {
  const normalizedPath = normalizePath(path);
  const splitted = normalizedPath.split('/');

  return splitted[0] === '' ? splitted[1] : splitted[0];
}

function getSlice(path) {
  const normalizedPath = normalizePath(path);
  const splitted = normalizedPath.split('/');

  return splitted[0] === '' ? splitted[2] : splitted[1];
}

function normalizePath(path) {
  const isWindowsOS = os.platform() === 'win32';
  return isWindowsOS ? path.replaceAll('\\', '/') : path;
}

// console.log(shouldBeRelative('/Users/nikolay/Documents/projects/ulbi-course/src/entities/Article/ui/ArticleList/ArticleList.tsx', 'entities/Article'))
// console.log(shouldBeRelative('/Users/nikolay/Documents/projects/ulbi-course/config/build/buildDevServer.ts', 'entities/Article'))
// console.log(shouldBeRelative('/Users/nikolay/Documents/projects/ulbi-course/src/shared/Button', 'shared/Card'))