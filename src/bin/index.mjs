#!/usr/bin/env node

// du -d 1 -h
// fstree -e "node_modules .git"
// fstree -e "node_modules .git" ~/.config/yarn/link

import { platform } from 'node:os';
import { parseArgs } from 'node:util';
import * as path from 'node:path';
import * as fs from 'node:fs';
import Tree from '@golden-tiger/tree';
import { gracefullyExit, formatSize } from './base.mjs';

process.on('unhandledRejection', error => {
  console.error(error);
  gracefullyExit();
});

main();

async function main() {
  const currentPlatform = platform();
  console.log(`Running at Platform: ${currentPlatform}`);

  const [ nodeExecutePath, fileExecutePath, ...commandArgs ] = process.argv;
  const cwd = process.cwd();
  console.log(`Using Node: ${nodeExecutePath}`);
  console.log(`Executing File: ${fileExecutePath}`);
  console.log(`Current Working Directory: ${cwd}`);

  const {
    values: argValues,
    positionals: argPositionals
  } = parseArgs({
    args: commandArgs,
    allowPositionals: true,
    options: {
      'exclude': {
        type: 'string',
        short: 'e',
        default: '',
      },
      'format': {
        type: 'string',
        short: 'f',
        default: '(type) name\t(size)'
      },
    },
  });

  console.log(`Arguments: ${JSON.stringify(argValues)}`);
  console.log(`Positionals: ${argPositionals}`);
  const targetPaths = Array.from(new Set(argPositionals.length ? argPositionals : ['.']));

  const excludeRegExps = (argValues['exclude'] || '')
    .split(' ')
    .filter(Boolean)
    .map(regexpStr => new RegExp(`^${regexpStr}$`));

  targetPaths.forEach(targetPath => {
    let absoluteTargetPath = '';
    if (/^(\/|\~)/.test(targetPath)) {
      absoluteTargetPath = targetPath;
    } else {
      absoluteTargetPath = path.join(cwd, targetPath);
    }
    displayFSTree(absoluteTargetPath, {
      exclude: excludeRegExps,
      format: argValues['format'],
    });
  });
}

function displayFSTree(targetPath, options) {
  const { exclude, format } = {
    ...options,
  };

  const fsTree = getFSTree(targetPath, { exclude });

  Tree.traverse(fsTree, (node) => {
    const { stat } = node;
    if (stat.isFile()
      || stat.isSymbolicLink()
    ) {
      node.size = stat.size;
    }
    if (stat.isDirectory()) {
      node.size = node.children?.reduce((acc, child) => acc + child.size, stat.size) || stat.size;
    }
  }, {
    order: 'post',
  });

  const state = {
    treeText: '',
  };
  Tree.traverse(fsTree, (node, state) => {
    const { depth, name, isLastChild, stat, size, entry } = node;

    let pad = '';
    for (let tempDepth = depth; tempDepth > 1; tempDepth--) {
      let nthParent = node;
      for (let nth = tempDepth; nth > 1; nth--) nthParent = nthParent.parent;
      pad += nthParent.isLastChild ? '   ' : '|  ';
    }
    pad += isLastChild ? '`- ' : '|- ';

    let type = 'd';
    if (entry?.isFile()) {
      type = '-';
    }
    if (entry?.isSymbolicLink()) {
      type = 'l';
    }

    const displayText = format
      .replaceAll(/\\t/g, '\t')
      .replaceAll(/type/g, type)
      .replaceAll(/name/g, name + (stat.isDirectory() ? '/' : ''))
      .replaceAll(/size/g, formatSize(size));
    state.treeText += `${(depth === 0 ? '' : pad)}${displayText}\n`;
    return state;
  }, {
    order: 'pre',
    state,
  });

  console.log(`\nDisplay of File System Tree at ${targetPath}:`);
  console.log(state.treeText);
}

function getFSTree(targetPath, options) {
  const { exclude } = {
    exclude: undefined,
    ...options,
  };
  const fsTree = {
    parent: null,
    depth: 0,
    path: targetPath,
    name: path.basename(targetPath),
    stat: tryStat(targetPath),
    isLastChild: false,
  };
  fsTree.children = getFSTreeChildren(targetPath, {
    exclude,
    parent: fsTree,
  });
  return fsTree;
}

function getFSTreeChildren(dirPath, options) {
  if (fs.statSync(dirPath).isFile()
    || fs.statSync(dirPath).isSymbolicLink()
  ) {
    return undefined;
  }

  const {
    parent,
    depth,
    exclude,
  } = {
    parent: null,
    depth: 0,
    exclude: undefined,
    ...options,
  };

  const dirEntries = fs.readdirSync(dirPath, {
    withFileTypes: true,
  })
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(entry => !exclude || !exclude.some(regexp => regexp.test(entry.name)));

  const children = dirEntries.map((entry, index) => {
    const name = entry.name;
    const entryPath = path.join(dirPath, name)
    const child = {
      parent,
      depth: depth + 1,
      path: entryPath,
      name,
      stat: tryStat(entryPath),
      entry,
    };
    if (entry.isDirectory()) {
      child.children = getFSTreeChildren(path.join(dirPath, entry.name), {
        ...options,
        parent: child,
        depth: depth + 1,
      });
      return child;
    }
    if (entry.isFile()
     || entry.isSymbolicLink()
    ) {
      return child;
    }
    return undefined;
  }).filter(Boolean);

  children.forEach((child, index, { length }) => {
    if (index === length - 1) {
      child.isLastChild = true;
    }
  });

  return children;
}

function tryStat(path) {
  try {
    // The size of a folder does not include the total size of the containing files or folders
    return fs.lstatSync(path);
    // return fs.statSync(path);
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
