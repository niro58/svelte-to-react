"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const babelParser = __importStar(require("@babel/parser"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TagProcessor {
    constructor() {
        this.shadMultipleImportComponents = [];
        this.typeFns = {
            File: (node) => this.file(node),
            ImportDeclaration: (node) => this.importDeclaration(node),
            ExportDefaultDeclaration: (node) => this.exportDefaultDeclaration(node),
            JSXElement: (node) => this.jsxElement(node),
            JSXText: (node) => this.jsxText(node),
            Program: (node) => this.program(node),
            BlockStatement: (node) => this.blockStatement(node),
            ReturnStatement: (node) => this.returnStatement(node),
            LogicalExpression: (node) => this.logicalExpression(node),
            ConditionalExpression: (node) => this.conditionalExpression(node),
            JSXExpressionContainer: (node) => this.jsxExpressionContainer(node),
            ArrayExpression: (node) => this.arrayExpression(node),
            ArrayPattern: (node) => this.arrayPattern(node),
            ArrowFunctionExpression: (node) => this.arrowFunctionExpression(node),
            BinaryExpression: (node) => this.binaryExpression(node),
            CallExpression: (node) => this.callExpression(node),
            ExpressionStatement: (node) => this.expressionStatement(node),
            FunctionDeclaration: (node) => this.functionDeclaration(node),
            Identifier: (node) => this.identifier(node),
            ImportDefaultSpecifier: (node) => this.importDefaultSpecifier(node),
            ImportSpecifier: (node) => this.importSpecifier(node),
            JSXAttribute: (node) => this.jsxAttribute(node),
            JSXClosingElement: (node) => this.jsxClosingElement(node),
            JSXClosingFragment: (node) => this.jsxClosingFragment(node),
            JSXFragment: (node) => this.jsxFragment(node),
            JSXIdentifier: (node) => this.jsxIdentifier(node),
            JSXOpeningElement: (node) => this.jsxOpeningElement(node),
            JSXOpeningFragment: (node) => this.jsxOpeningFragment(node),
            JSXSpreadAttribute: (node) => this.jsxSpreadAttribute(node),
            MemberExpression: (node) => this.memberExpression(node),
            NullLiteral: (node) => this.nullLiteral(node),
            NumericLiteral: (node) => this.numericLiteral(node),
            ObjectExpression: (node) => this.objectExpression(node),
            ObjectPattern: (node) => this.objectPattern(node),
            ObjectProperty: (node) => this.objectProperty(node),
            StringLiteral: (node) => this.stringLiteral(node),
            VariableDeclaration: (node) => this.variableDeclaration(node),
            VariableDeclarator: (node) => this.variableDeclarator(node),
        };
    }
    blockStatement(n) {
        return {
            next: n.body,
        };
    }
    returnStatement(n) {
        return {
            next: n.argument,
        };
    }
    process(node) {
        if (!node || !Object.keys(this.typeFns).includes(node.type))
            return;
        return this.typeFns[node.type](node);
    }
    jsxExpressionContainer(n) {
        return {
            next: n.expression,
        };
    }
    conditionalExpression(n) {
        return {};
    }
    logicalExpression(n) {
        if (n.operator === "&&") {
            return {
                openingTag: "{#if " + n.left.name + "}",
                next: n.right,
                closingTag: "{/if}",
            };
        }
    }
    file(n) {
        return {
            next: n.program,
        };
    }
    program(n) {
        return {
            openingTag: "<script lang='ts'>",
            next: n.body,
        };
    }
    exportDefaultDeclaration(n) {
        return {
            next: n.declaration.body,
            openingTag: "</script>",
        };
    }
    importDeclaration(n) {
        var _a;
        let importDeclaration = "import ";
        const value = n.source.value;
        const isShadImport = value === null || value === void 0 ? void 0 : value.toString().startsWith("@/components/ui");
        const isMultipleImport = n.specifiers.length > 1;
        if (value === "react" || !isShadImport) {
            return null;
        }
        const componentName = (_a = value === null || value === void 0 ? void 0 : value.toString().split("/")) === null || _a === void 0 ? void 0 : _a.pop();
        if (!componentName)
            return;
        const componentNameUppercased = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        if (isMultipleImport) {
            this.shadMultipleImportComponents.push(componentName);
            importDeclaration += `* as ${componentNameUppercased} from '$lib/components/ui/${componentName}/index.js'`;
        }
        else {
            importDeclaration += `${componentNameUppercased} from '$lib/components/ui/${componentName}/${componentName}.svelte'`;
        }
        importDeclaration += ";";
        return importDeclaration;
    }
    jsxText(n) {
        return n.value;
    }
    jsxElement(n) {
        const componentName = this.correctComponentName(n.openingElement.name.name);
        return {
            openingTag: `<${componentName}${this.getAttributes(n.openingElement.attributes)}>`,
            next: n.children,
            closingTag: `</${componentName}>`,
        };
    }
    getAttributes(attributes) {
        if (!attributes)
            return "";
        let att = [];
        attributes.map((a) => {
            const name = a.name.name;
            const value = a.value.value;
            if (name === "className") {
                att.push(`class="${value}"`);
            }
            else if (name === "htmlFor") {
                att.push(`for="${value}"`);
            }
            else if (name.startsWith("on")) {
                att.push(`${name.toLowerCase()}={()=>{}}`);
            }
            else {
                att.push(`${name}="${value}"`);
            }
        });
        return " " + att.join(" ");
    }
    correctComponentName(name) {
        if (name[0] === name[0].toLowerCase()) {
            return name;
        }
        const res = name.split(/(?=[A-Z])/);
        if (res.length === 1) {
            if (this.shadMultipleImportComponents.includes(name)) {
                return `${name}.Root`;
            }
            else {
                return name;
            }
        }
        else {
            return res.join(".");
        }
    }
    arrayExpression(node) {
        return {
            next: node.elements,
        };
    }
    arrayPattern(node) {
        return {
            next: node.elements,
        };
    }
    arrowFunctionExpression(node) {
        return {
            next: node.body,
        };
    }
    binaryExpression(node) { }
    callExpression(node) { }
    expressionStatement(node) { }
    functionDeclaration(node) { }
    identifier(node) {
        return node.name;
    }
    importDefaultSpecifier(node) {
        return {
            next: node.local,
        };
    }
    importSpecifier(node) { }
    jsxAttribute(node) { }
    jsxClosingElement(node) { }
    jsxClosingFragment(node) { }
    jsxFragment(node) { }
    jsxIdentifier(node) { }
    jsxOpeningElement(node) { }
    jsxOpeningFragment(node) { }
    jsxSpreadAttribute(node) { }
    memberExpression(node) { }
    nullLiteral(node) {
        return "null";
    }
    numericLiteral(node) {
        return node.value.toString();
    }
    objectExpression(node) {
        return {
            next: node.properties,
        };
    }
    objectPattern(node) {
        return node.properties;
    }
    objectProperty(node) { }
    stringLiteral(node) {
        return node.value;
    }
    variableDeclaration(node) {
        if (node.declarations.length > 1) {
            return {
                openingTag: "let ",
                next: node.declarations,
            };
        }
        else {
            return {
                openingTag: "const ",
                next: node.declarations,
            };
        }
    }
    variableDeclarator(node) {
        return {
            openingTag: node.id.name + " = ",
            next: node.init,
        };
    }
}
class FileManager {
    static writeToFile(filePath, content) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`Writing to ${filePath}`);
    }
    static readFromFile(filePath) {
        return fs.readFileSync(filePath, "utf8");
    }
}
const reactScript = FileManager.readFromFile(path.join(__dirname, "..", "input", "react.tsx"));
let tagProcessor = new TagProcessor();
let script = "";
let header = "";
let body = "";
function reactToSvelte(node) {
    const nodeResult = tagProcessor.process(node);
    if (!nodeResult || nodeResult === null)
        return;
    if (typeof nodeResult === "string") {
        // result += nodeResult + "\n";
    }
    else if (nodeResult && typeof nodeResult === "object") {
        if ("openingTag" in nodeResult) {
            // result += nodeResult.openingTag + "\n";
        }
        if ("next" in nodeResult) {
            if (Array.isArray(nodeResult.next)) {
                nodeResult.next.map((n) => {
                    reactToSvelte(n);
                });
            }
            else {
                reactToSvelte(nodeResult.next);
            }
        }
        if ("closingTag" in nodeResult) {
            // result += nodeResult.closingTag + "\n";
        }
    }
}
const reactParsed = babelParser.parse(reactScript, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
});
FileManager.writeToFile(path.join(__dirname, "..", "output", "reactParsed.json"), JSON.stringify(reactParsed, null, 2));
// const outputPath = path.join(__dirname, "..", "output", "result.svelte");
reactToSvelte(reactParsed);
// FileManager.writeToFile(outputPath, result);
