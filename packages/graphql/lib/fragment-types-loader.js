const { promisify } = require('util');
const { readFile: nodeReadFile } = require('fs');
const debug = require('debug')('hops:graphql:fragment-types-loader');
const { HttpLink } = require('apollo-link-http');
const fetch = require('cross-fetch');
const { graphql } = require('graphql');
const {
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  introspectSchema,
} = require('graphql-tools');
const { getOptions } = require('loader-utils');

const readFile = promisify(nodeReadFile);

const query = `
query IntrospectionQuery {
  __schema {
    types {
      kind
      name
      possibleTypes {
        name
      }
    }
  }
}
`;

async function getMockSchema(file) {
  const schema = require(file);
  return await Promise.resolve(schema.default || schema);
}

async function getLocalSchema(file) {
  const typeDefs = await readFile(file, 'utf-8');
  return makeExecutableSchema({ typeDefs });
}

async function getRemoteSchema(uri) {
  const link = new HttpLink({ uri, fetch });
  return await makeRemoteExecutableSchema({
    schema: await introspectSchema(link),
    link,
  });
}

async function queryFragmentTypes(schema) {
  const { data } = await graphql(schema, query);
  data.__schema.types = data.__schema.types.filter(
    t => t.possibleTypes !== null
  );
  return JSON.stringify(data);
}

module.exports = function fragmentTypesLoader(source) {
  this.cacheable(false);
  const callback = this.async();
  const { graphqlUri, graphqlSchemaFile, graphqlMockSchemaFile } = getOptions(
    this
  );

  async function getFragmentTypes(schemaPromise) {
    try {
      const schema = await schemaPromise;
      return callback(null, await queryFragmentTypes(schema));
    } catch (error) {
      debug('Error querying for fragment types', error.result || error);
      return callback(null, source);
    }
  }

  if (process.env.NODE_ENV !== 'production' && graphqlMockSchemaFile) {
    debug('Using mock schema file', graphqlMockSchemaFile);
    return getFragmentTypes(getMockSchema(graphqlMockSchemaFile));
  }
  if (graphqlSchemaFile) {
    debug('Using local schema file', graphqlSchemaFile);
    return getFragmentTypes(getLocalSchema(graphqlSchemaFile));
  }
  if (graphqlUri) {
    debug('Using remote endpoint', graphqlUri);
    return getFragmentTypes(getRemoteSchema(graphqlUri));
  }

  return callback(null, source);
};
