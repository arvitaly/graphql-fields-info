"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const g = require("graphql");
;
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
            throw new Error("GraphQLFieldInfo::Not found ViewerNode");
        }
        return viewerNode.fields[0].fields;
    }
    getQueryConnectionFields() {
        const viewerNode = this.getFields().find((f) => f.name === "viewer");
        if (!viewerNode) {
            throw new Error("GraphQLFieldInfo::Not found ViewerNode");
        }
        const connField = viewerNode.fields.find((f) => f.name !== "id");
        if (!connField) {
            throw new Error("GraphQLFieldInfo::Not found field for connection");
        }
        return this.getFieldsForConnection(connField);
    }
    getMutationPayloadFields() {
        return this.getFields()[0].fields[0].fields;
    }
    getFieldsForConnection(field) {
        const edgesNode = field.fields.find((f) => f.name === "edges");
        if (!edgesNode) {
            throw new Error("GraphQLFieldInfo::Not found EdgesNode");
        }
        const edgesNodeNode = edgesNode.fields.find((f) => f.name === "node");
        if (!edgesNodeNode) {
            throw new Error("GraphQLFieldInfo::Not found edgesNodeNode");
        }
        return edgesNodeNode.fields;
    }
    print() {
        if (!this.schema) {
            return;
        }
        return g.print(this.operation) + "\n" + Object.keys(this.fragments).map((fragmentName) => {
            return g.print(this.fragments[fragmentName]);
        }).join("\n");
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
            args: [],
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
            isConnection: false,
            isNode: false,
            node,
        };
    }
    parseFragmentSpreadNode(node) {
        return {
            args: [],
            name: node.name.value,
            isFragment: true,
            isConnection: false,
            fields: this.parseSelectionSetNode(this.fragments[node.name.value].selectionSet),
            isNode: false,
            node,
        };
    }
    parseInlineFragmentNode(node) {
        return {
            args: [],
            name: "",
            isFragment: true,
            isConnection: false,
            fields: this.parseSelectionSetNode(node.selectionSet),
            isNode: false,
            node,
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
    getInfoFromOutputType(type) {
        let info;
        if (g.isCompositeType(type)) {
            if (g.isAbstractType(type)) {
                throw new Error("GraphQLFieldInfo::Not implemented union type");
            }
            else {
                info = {
                    fields: type.getFields(),
                    interfaces: type.getInterfaces(),
                    isConnection: type.name.endsWith("Connection"),
                };
            }
        }
        else {
            if (typeof (type.ofType) !== "undefined") {
                info = this.getInfoFromOutputType(type.ofType);
            }
        }
        if (type instanceof g.GraphQLEnumType) {
            // TODO
            throw new Error("GraphQLFieldInfo::Not implemented enum type");
        }
        return info;
    }
    getNodeInterface() {
        if (!this.schema) {
            throw new Error("GraphQLFieldInfo::Need schema for get node type");
        }
        return this.schema.getType("Node");
    }
    applySchemaToField(field, graphqlField) {
        field.type = graphqlField.type;
        field.args = graphqlField.args;
        const graphqlInfo = this.getInfoFromOutputType(graphqlField.type);
        if (typeof (graphqlInfo) !== "undefined") {
            const nodeInterface = this.getNodeInterface();
            if (graphqlInfo.interfaces.find((i) => i === nodeInterface)) {
                field.isNode = true;
            }
            field.isConnection = graphqlInfo.isConnection;
        }
        if (field.fields.length > 0) {
            if (typeof (graphqlInfo) === "undefined") {
                throw new Error("GraphQLFieldInfo::Invalid type for field " + field.name);
            }
            this.applySchemaToFields(field.fields, graphqlInfo.fields);
        }
    }
    applySchemaToFields(fields, graphqlFields) {
        fields.map((field) => {
            if (!graphqlFields[field.name]) {
                throw new Error("GraphQLFieldInfo::Not found schema-field for field: " + field.name);
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
                this.applySchemaToFields(this.fields, this.schema.getQueryType().getFields());
                break;
            case "mutation":
                this.applySchemaToFields(this.fields, this.schema.getMutationType().getFields());
                break;
            case "subscription":
                this.applySchemaToFields(this.fields, this.schema.getSubscriptionType().getFields());
                break;
            default:
        }
    }
}
exports.GraphQLFieldsInfo = GraphQLFieldsInfo;
;
function fromQuery(q, schema) {
    const document = g.parse(q);
    const fragments = {};
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
exports.default = fromQuery;
