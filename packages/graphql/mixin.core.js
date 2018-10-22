const { Mixin } = require('hops-mixin');
const {
  internal: { createWebpackMiddleware, StatsFilePlugin },
} = require('@untool/webpack');

function exists(path) {
  try {
    require.resolve(path);
    return true;
  } catch (e) {
    return false;
  }
}

class GraphQLMixin extends Mixin {
  configureServer(rootApp, middleware, mode) {
    if (!exists(this.config.graphqlMockSchemaFile) || mode !== 'develop') {
      return;
    }

    middleware.preroutes.unshift(
      createWebpackMiddleware(
        this.getBuildConfig('graphql-mock-server', 'node'),
        true
      )
    );
  }

  configureBuild(webpackConfig, loaderConfigs, target) {
    const { allLoaderConfigs } = loaderConfigs;

    allLoaderConfigs.splice(
      allLoaderConfigs.length - 1,
      0,
      {
        test: /\.(graphql|gql)$/,
        loader: 'graphql-tag/loader',
      },
      {
        test: require.resolve('./fragment-types.json'),
        loader: require.resolve('./lib/fragment-types-loader'),
        options: {
          graphqlUri: this.config.graphqlUri,
          graphqlSchemaFile: this.config.graphqlSchemaFile,
          graphqlMockSchemaFile: this.config.graphqlMockSchemaFile,
        },
      }
    );

    webpackConfig.externals.push('encoding');

    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (exists(this.config.graphqlMockSchemaFile)) {
      webpackConfig.resolve.alias['hops-graphql/schema'] = require.resolve(
        this.config.graphqlMockSchemaFile
      );
    }

    if (target === 'graphql-mock-server') {
      webpackConfig.externals.push(
        'apollo-server-express',
        'express',
        'graphql'
      );

      webpackConfig.output.filename = 'hops-graphql-mock-server.js';
      webpackConfig.resolve.alias['@untool/entrypoint'] = require.resolve(
        './lib/mock-server-middleware'
      );

      webpackConfig.plugins = webpackConfig.plugins.filter(
        p => !(p instanceof StatsFilePlugin)
      );
    }
  }
}

module.exports = GraphQLMixin;
