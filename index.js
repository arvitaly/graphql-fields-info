"use strict";
const g = require("graphql");
class GraphQLFieldsInfo {
    constructor(operation, fragments, schema) {
        this.operation = operation;
        this.fragments = fragments;
        this.schema = schema;
    }
    getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
        this.applySchema();
        return this.fields;
    }
    getNodeFields() {
        return this.getFields()[0].fields;
    }
    getQueryOneFields() {
        const viewerNode = this.getFields().find((f) => f.name === "viewer");
        if (!viewerNode) {
            throw new Error("Not found ViewerNode");
        }
        return viewerNode.fields[0].fields;
    }
    getQueryConnectionFields() {
        const viewerNode = this.getFields().find((f) => f.name === "viewer");
        if (!viewerNode) {
            throw new Error("Not found ViewerNode");
        }
        return this.getFieldsForConnection(viewerNode.fields[0]);
    }
    getMutationPayloadFields() {
        return this.getFields()[0].fields[0].fields;
    }
    getFieldsForConnection(field) {
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
    parseAllFields() {
        return this.parseSelectionSetNode(this.operation.selectionSet);
    }
    parseSelectionSetNode(node) {
        let fields = [];
        node.selections.map((childNode) => {
            const child = this.parseSelectionNode(childNode);
            if (child.isFragment) {
                fields = fields.concat(child.fields);
            }
            else {
                fields.push(child);
            }
        });
        return fields;
    }
    parseFieldNode(node) {
        return {
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
        };
    }
    parseFragmentSpreadNode(node) {
        return {
            name: node.name.value,
            isFragment: true,
            fields: this.parseSelectionSetNode(this.fragments[node.name.value].selectionSet),
        };
    }
    parseInlineFragmentNode(node) {
        return {
            name: "",
            isFragment: true,
            fields: this.parseSelectionSetNode(node.selectionSet),
        };
    }
    parseSelectionNode(node) {
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
    getFieldsFromOutputType(type) {
        let graphqlFields;
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
    applySchemaToField(field, graphqlField) {
        field.type = graphqlField.type;
        const graphqlFields = this.getFieldsFromOutputType(graphqlField.type);
        if (field.fields.length > 0) {
            if (typeof (graphqlFields) === "undefined") {
                throw new Error("Invalid type for field " + field.name);
            }
            this.applySchemaToFields(field.fields, graphqlFields);
        }
    }
    applySchemaToFields(fields, graphqlFields) {
        fields.map((field) => {
            if (!graphqlFields[field.name]) {
                throw new Error("Not found schema-field for field: " + field.name);
            }
            this.applySchemaToField(field, graphqlFields[field.name]);
        });
    }
    applySchema() {
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
}
exports.GraphQLFieldsInfo = GraphQLFieldsInfo;
;
function fromQuery(q, schema) {
    const document = g.parse(q);
    let fragments = {};
    document.definitions.filter((definition) => {
        return definition.kind === "FragmentDefinition";
    }).map((node) => {
        fragments[node.name.value] = node;
    });
    const operation = document
        .definitions.find((node) => node.kind === "OperationDefinition");
    return new GraphQLFieldsInfo(operation, fragments, schema);
}
exports.fromQuery = fromQuery;
function fromResolveInfo(info, schema) {
    return new GraphQLFieldsInfo(info.operation, info.fragments, schema);
}
exports.fromResolveInfo = fromResolveInfo;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fromQuery;
