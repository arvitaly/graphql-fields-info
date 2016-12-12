import { fromQuery } from "./..";
describe("info", () => {
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
                model1{
                    field1
                    model2{
                        field2
                    }
                }
            }
            `);
        expect(parser.getQueryConnectionFields()).toMatchSnapshot();
    });
});
