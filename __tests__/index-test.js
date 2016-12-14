"use strict";
const g = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const __1 = require("./..");
const nodeInterface = graphql_relay_1.nodeDefinitions(() => { }, () => {
    return null;
});
describe("info", () => {
    it("simple query and print", () => {
        const schema = new g.GraphQLSchema({
            query: new g.GraphQLObjectType({
                name: "Query",
                fields: {
                    test: { type: g.GraphQLString },
                },
            }),
        });
        const parser = __1.fromQuery(`query Q1{
            test
        }`, schema);
        expect(parser.getFields()).toMatchSnapshot();
        expect(parser.print()).toMatchSnapshot();
    });
    it("parse all fields", () => {
        const parser = __1.fromQuery(`query Q1{ 
        node{ 
            model1{ field1 }
            model2{
                ... on Model2{
                    field2
                } 
            }
        } 
    }`);
        expect(parser.getFields()).toMatchSnapshot();
    });
    it("get node fields", () => {
        const parser = __1.fromQuery(`query Q1{ node{ model1{ field1 } } }`);
        expect(parser.getNodeFields()).toMatchSnapshot();
    });
    it("get query one fields", () => {
        const parser = __1.fromQuery(`query Q1{ viewer{ model1{ field1, model2{ field2 } }} }`);
        expect(parser.getQueryOneFields()).toMatchSnapshot();
    });
    it("get query connection fields simple", () => {
        const parser = __1.fromQuery(`query Q1{
            viewer{
                modelName1s{
                    edges{
                        node{
                            name
                        }
                    }
                    
                }
            }
        }`);
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
    });
    it("get query connection fields with fragments, change selection node and print", () => {
        const schema = new g.GraphQLSchema({
            query: new g.GraphQLObjectType({
                name: "Query",
                fields: {
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
        const parser = __1.fromQuery(`query Q1{
            viewer{
                model1(first:10){
                    pageInfo{
                        hasNextPage
                    }
                    ...F1
                }}
            }
            fragment F1 on Model1Connection{
                 edges{
                     node{
                         ...F2
                     }
                 }
            }
            fragment F2 on Model1{
                field1
                model2{
                    field2
                }
            }
            `, schema);
        const fields = parser.getFields();
        expect(fields).toMatchSnapshot();
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
        const sel = fields[0].fields[0].fields[1].fields[0].node.selectionSet;
        if (sel) {
            sel.selections.push({
                name: { kind: "Name", value: "id" },
                kind: "Field",
            });
        }
        expect(parser.print()).toMatchSnapshot();
    });
});
