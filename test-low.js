#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');

const dependencyTypes = [
  'dependencies',
  'peerDependencies',
  'devDependencies',
  'optionalDependencies',
  'bundledDependencies',
];

const cwd = process.cwd();

const { workspaces } = require(path.join(cwd, 'package.json'));

const manifests = glob
  .sync(workspaces.map(pattern => path.join(cwd, pattern, 'package.json')))
  .map(file => ({ file, manifest: require(file) }));

manifests.forEach(({ file, manifest }) => {
  dependencyTypes.forEach(type => {
    const dependencies = manifest[type] || {};

    Object.entries(dependencies).forEach(([name, version]) => {
      dependencies[name] = version.replace(/[~^]/, '~');
    });
  });
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
});
