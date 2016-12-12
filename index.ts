import {
    FieldNode, FragmentDefinitionNode, FragmentSpreadNode, GraphQLResolveInfo,
    InlineFragmentNode, OperationDefinitionNode,
    parse, SelectionNode, SelectionSetNode,
} from "graphql";
export type Field = {
    name: string;
    fields: Fields;
    isFragment?: boolean;
};
export type Fields = Field[];
export class GraphQLFieldsInfo {
    protected fields: Fields;
    constructor(
        protected operation: OperationDefinitionNode,
        protected fragments: { [fragmentName: string]: FragmentDefinitionNode }) {

    }
    public getFields() {
        if (!this.fields) {
            this.fields = this.parseAllFields();
        }
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
    protected parseSelectionSetNode(node: SelectionSetNode): Field[] {
        let fields: Field[] = [];
        node.selections.map((childNode) => {
            const field = this.parseSelectionNode(childNode);
            if (field.isFragment) {
                fields = fields.concat(field.fields);
            } else {
                fields.push(field);
            }
        });
        return fields;
    }
    protected parseFieldNode(node: FieldNode): Field {
        return {
            name: node.name.value,
            fields: node.selectionSet ? this.parseSelectionSetNode(node.selectionSet) : [],
        };
    }
    protected parseFragmentSpreadNode(node: FragmentSpreadNode): Field {
        return {
            name: node.name.value,
            isFragment: true,
            fields: this.parseSelectionSetNode(this.fragments[node.name.value].selectionSet),
        };
    }
    protected parseInlineFragmentNode(node: InlineFragmentNode): Field {
        return {
            name: "",
            isFragment: true,
            fields: this.parseSelectionSetNode(node.selectionSet),
        };
    }
    protected parseSelectionNode(node: SelectionNode): Field {
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
};
export function fromQuery(q: string) {
    const document = parse(q);
    let fragments: { [fragmentName: string]: FragmentDefinitionNode } = {};
    document.definitions.filter((definition) => {
        return definition.kind === "FragmentDefinition";
    }).map((node: FragmentDefinitionNode) => {
        fragments[node.name.value] = node;
    });
    const operation = document
        .definitions.find((node) => node.kind === "OperationDefinition") as OperationDefinitionNode;
    return new GraphQLFieldsInfo(operation, fragments);
}
export function fromResolveInfo(info: GraphQLResolveInfo) {
    return new GraphQLFieldsInfo(info.operation, info.fragments);
}
export default fromQuery;
