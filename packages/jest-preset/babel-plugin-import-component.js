module.exports = function importComponentPlugin({ types: t }) {
  return {
    visitor: {
      ImportSpecifier(path) {
        if (
          path.node.imported.name !== 'importComponent' ||
          !['@untool/react', 'untool', 'hops', this.opts.module].includes(
            path.parent.source.value
          )
        ) {
          return;
        }

        path.scope.getBinding('importComponent').referencePaths.forEach(ref => {
          if (!t.isCallExpression(ref.parentPath)) {
            return;
          }

          const arg = ref.parentPath.get('arguments')[0];
          t.assertObjectExpression(arg);
          arg.traverse({
            ObjectProperty(path) {
              // Remove `require.resolveWeak`, which does not exist in jest
              if (path.node.key.name === 'moduleId') {
                path.node.value = t.numericLiteral(0);
              }

              if (path.node.key.name === 'load') {
                const loadFunction = path.get('value');
                t.assertArrowFunctionExpression(loadFunction);
                const moduleName = loadFunction.get('body.arguments.0');

                loadFunction
                  .get('body')
                  .replaceWithSourceString(
                    `Promise.resolve(require(${moduleName}))`
                  );
              }
            },
          });
        });
      },
    },
  };
};
