import { fromQuery } from "./..";
import schema from "./../__fixtures__/schema";

describe("Info with schema", () => {
    it("node query", () => {
        const query = `query Q1{
            node(id:"1"){
                ...F1
            }
        }
        fragment F1 on Model1{
            field1
        }
        `;
        const fieldsInfo = fromQuery(query, schema);
        expect(fieldsInfo.getFields()).toMatchSnapshot();
    });
    it("connection with fragment query", () => {
        const query = `query Q1{
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
        `;
        const fieldsInfo = fromQuery(query, schema);
        expect(fieldsInfo.getFields()).toMatchSnapshot();
    });
});
