import * as g from "graphql";
export type Field = {
    name: string;
    fields: Fields;
    type?: g.GraphQLOutputType;
    isFragment?: boolean;
};
export type Fields = Field[];
export class GraphQLFieldsInfo {
    protected fields: Fields;
    constructor(
        protected operation: g.OperationDefinitionNode,
        protected fragments: { [fragmentName: string]: g.FragmentDefinitionNode }, protected schema?: g.GraphQLSchema) {

    }
    public getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
        this.applySchema();
        return this.fields;
    }
    public getNodeFields() {
        return this.getFields()[0].fields;
    }
    public getQueryOneFields() {
        const viewerNode = this.getFields().find((f) => f.name === "viewer");
        if (!viewerNode) {
            throw new Error("Not found ViewerNode");
        }
        return viewerNode.fields[0].fields;
    }
    public getQueryConnectionFields() {
        const viewerNode = this.getFields().find((f) => f.name === "viewer");
        if (!viewerNode) {
            throw new Error("Not found ViewerNode");
        }
        return this.getFieldsForConnection(viewerNode.fields[0]);
    }
    public getMutationPayloadFields() {
        return this.getFields()[0].fields[0].fields;
    }
    public getFieldsForConnection(field: Field) {
        const edgesNode = field.fields.find((f) => f.name === "edges");
        if (!edgesNode) {
            throw new Error("Not found EdgesNode");
        }
        const edgesNodeNode = edgesNode.fields.find((f) => f.name === "node");
        if (!edgesNodeNode) {
            throw new Error("Not found edgesNodeNode");
        }
        return edgesNodeNode.fields;
    }
    protected parseAllFields() {
        return this.parseSelectionSetNode(this.operation.selectionSet);
    }
    protected parseSelectionSetNode(node: g.SelectionSetNode): Field[] {
        let fields: Field[] = [];
        node.selections.map((childNode) => {
            const child = this.parseSelectionNode(childNode);
            if (child.isFragment) {
                fields = fields.concat(child.fields);
            } else {
                fields.push(child);
            }
        });
        return fields;
    }
    protected parseFieldNode(node: g.FieldNode): Field {
        return {
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
        };
    }
    protected parseFragmentSpreadNode(node: g.FragmentSpreadNode): Field {
        return {
            name: node.name.value,
            isFragment: true,
            fields: this.parseSelectionSetNode(this.fragments[node.name.value].selectionSet),
        };
    }
    protected parseInlineFragmentNode(node: g.InlineFragmentNode): Field {
        return {
            name: "",
            isFragment: true,
            fields: this.parseSelectionSetNode(node.selectionSet),
        };
    }
    protected parseSelectionNode(node: g.SelectionNode): Field {
        switch (node.kind) {
            case "Field":
                return this.parseFieldNode(node);
            case "FragmentSpread":
                return this.parseFragmentSpreadNode(node);
            case "InlineFragment":
                return this.parseInlineFragmentNode(node);
            default:
        }
        throw new Error("Unknown kind");
    }
    protected getFieldsFromOutputType(type: g.GraphQLOutputType): g.GraphQLFieldMap<any, any> | undefined {
        let graphqlFields: g.GraphQLFieldMap<any, any> | undefined;
        if (type instanceof g.GraphQLObjectType) {
            graphqlFields = type.getFields();
        }
        if (type instanceof g.GraphQLList) {
            graphqlFields = this.getFieldsFromOutputType(type.ofType);
        }
        if (type instanceof g.GraphQLNonNull) {
            graphqlFields = this.getFieldsFromOutputType(type.ofType);
        }
        if (type instanceof g.GraphQLEnumType) {
            // TODO
            throw new Error("Not implemented enum type");
        }
        if (type instanceof g.GraphQLUnionType) {
            // TODO
            throw new Error("Not implemented union type");
        }
        return graphqlFields;
    }
    protected applySchemaToField(field: Field, graphqlField: g.GraphQLField<any, any>) {
        field.type = graphqlField.type;
        const graphqlFields = this.getFieldsFromOutputType(graphqlField.type);
        if (field.fields.length > 0) {
            if (typeof (graphqlFields) === "undefined") {
                throw new Error("Invalid type for field " + field.name);
            }
            this.applySchemaToFields(field.fields, graphqlFields);
        }
    }
    protected applySchemaToFields(fields: Fields, graphqlFields: g.GraphQLFieldMap<any, any>) {
        fields.map((field) => {
            if (!graphqlFields[field.name]) {
                throw new Error("Not found schema-field for field: " + field.name);
            }
            this.applySchemaToField(field, graphqlFields[field.name]);
        });
    }
    protected applySchema() {
        if (!this.schema) {
            return;
        }
        switch (this.operation.operation) {
            case "query":
                const graphqlFields = this.schema.getQueryType().getFields();
                this.applySchemaToFields(this.fields, graphqlFields);
            case "mutation":
                break;
            case "subscription":
                break;
            default:
        }
    }

};
export function fromQuery(q: string, schema?: g.GraphQLSchema) {
    const document = g.parse(q);
    let fragments: { [fragmentName: string]: g.FragmentDefinitionNode } = {};
    document.definitions.filter((definition) => {
        return definition.kind === "FragmentDefinition";
    }).map((node: g.FragmentDefinitionNode) => {
        fragments[node.name.value] = node;
    });
    const operation = document
        .definitions.find((node) => node.kind === "OperationDefinition") as g.OperationDefinitionNode;
    return new GraphQLFieldsInfo(operation, fragments, schema);
}
export function fromResolveInfo(info: g.GraphQLResolveInfo, schema?: g.GraphQLSchema) {
    return new GraphQLFieldsInfo(info.operation, info.fragments, schema);
}
export default fromQuery;
