import * as g from "graphql";
import { nodeDefinitions } from "graphql-relay";
const nodeInterface = nodeDefinitions(() => {/* */ }, () => {
    return null as any;
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
                                                                            type:
                                                                            new g.GraphQLNonNull(g.GraphQLID),
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
export default schema;
