import * as g from "graphql";
import { fromQuery } from "./..";
describe("info", () => {
    it("simple query", () => {
        const schema = new g.GraphQLSchema({
            query: new g.GraphQLObjectType({
                name: "Query",
                fields: {
                    test: { type: g.GraphQLString },
                },
            }),
        });
        const parser = fromQuery(`query Q1{
            test
        }`, schema);
        expect(parser.getFields()).toMatchSnapshot();
    });
    it("parse all fields", () => {
        const parser = fromQuery(`query Q1{ 
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
        const parser = fromQuery(`query Q1{ node{ model1{ field1 } } }`);
        expect(parser.getNodeFields()).toMatchSnapshot();
    });
    it("get query one fields", () => {
        const parser = fromQuery(`query Q1{ viewer{ model1{ field1, model2{ field2 } }} }`);
        expect(parser.getQueryOneFields()).toMatchSnapshot();
    });
    it("get query connection fields simple", () => {
        const parser = fromQuery(`query Q1{
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
    it("get query connection fields with fragments", () => {
        const schema = new g.GraphQLSchema({
            query: new g.GraphQLObjectType({
                name: "Query",
                fields: {
                    viewer: {
                        type: new g.GraphQLObjectType({
                            name: "Viewer",
                            fields: {
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
                                                                    field1: { type: g.GraphQLString },
                                                                    model2: {
                                                                        type: new g.GraphQLObjectType({
                                                                            name: "Model2",
                                                                            fields: {
                                                                                field2: { type: g.GraphQLInt },
                                                                            },
                                                                        }),
                                                                    },
                                                                },
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
                        }),
                    },
                },
            }),
        });
        const parser = fromQuery(`query Q1{
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
        expect(parser.getFields()).toMatchSnapshot();
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
    });
});
