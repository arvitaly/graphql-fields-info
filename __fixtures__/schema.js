"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const g = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const nodeInterface = graphql_relay_1.nodeDefinitions(() => { }, () => {
    return null;
});
const schema = new g.GraphQLSchema({
    query: new g.GraphQLObjectType({
        name: "Query",
        fields: {
            node: nodeInterface.nodeField,
            viewer: {
                type: new g.GraphQLObjectType({
                    name: "Viewer",
                    fields: {
                        id: { type: new g.GraphQLNonNull(g.GraphQLID) },
                        model1: {
                            type: new g.GraphQLObjectType({
                                name: "Model1Connection",
                                fields: {
                                    edges: {
                                        type: new g.GraphQLNonNull(new g.GraphQLList(new g.GraphQLObjectType({
                                            name: "Model1ConnectionEdge",
                                            fields: {
                                                node: {
                                                    type: new g.GraphQLObjectType({
                                                        name: "Model1",
                                                        fields: {
                                                            id: { type: new g.GraphQLNonNull(g.GraphQLID) },
                                                            field1: { type: g.GraphQLString },
                                                            model2: {
                                                                type: new g.GraphQLObjectType({
                                                                    name: "Model2",
                                                                    fields: {
                                                                        field2: { type: g.GraphQLInt },
                                                                        id: {
                                                                            type: new g.GraphQLNonNull(g.GraphQLID),
                                                                        },
                                                                    },
                                                                    interfaces: [nodeInterface.nodeInterface],
                                                                }),
                                                            },
                                                        },
                                                        interfaces: [nodeInterface.nodeInterface],
                                                    }),
                                                },
                                            },
                                        }))),
                                    },
                                    pageInfo: {
                                        type: new g.GraphQLObjectType({
                                            name: "Model1ConnectionPageInfo",
                                            fields: {
                                                hasNextPage: { type: g.GraphQLBoolean },
                                            },
                                        }),
                                    },
                                },
                            }),
                        },
                    },
                    interfaces: [nodeInterface.nodeInterface],
                }),
            },
        },
    }),
});
exports.default = schema;
