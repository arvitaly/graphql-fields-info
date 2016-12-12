"use strict";
const graphql_1 = require("graphql");
class GraphQLFieldsInfo {
    constructor(operation, fragments) {
        this.operation = operation;
        this.fragments = fragments;
    }
    getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
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
            const field = this.parseSelectionNode(childNode);
            if (field.isFragment) {
                fields = fields.concat(field.fields);
            }
            else {
                fields.push(field);
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
}
exports.GraphQLFieldsInfo = GraphQLFieldsInfo;
;
function fromQuery(q) {
    const document = graphql_1.parse(q);
    let fragments = {};
    document.definitions.filter((definition) => {
        return definition.kind === "FragmentDefinition";
    }).map((node) => {
        fragments[node.name.value] = node;
    });
    const operation = document
        .definitions.find((node) => node.kind === "OperationDefinition");
    return new GraphQLFieldsInfo(operation, fragments);
}
exports.fromQuery = fromQuery;
function fromResolveInfo(info) {
    return new GraphQLFieldsInfo(info.operation, info.fragments);
}
exports.fromResolveInfo = fromResolveInfo;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fromQuery;
