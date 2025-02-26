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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const babelParser = __importStar(require("@babel/parser"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TagProcessor {
    constructor() {
        this.shadMultipleImportComponents = [];
        this.typeFns = {
            File: () => this.file(),
            ImportDeclaration: () => this.importDeclaration(),
            ExportDefaultDeclaration: () => this.exportDefaultDeclaration(),
            JSXElement: () => this.jsxElement(),
            JSXText: () => this.jsxText(),
            Program: () => this.program(),
            BlockStatement: () => this.blockStatement(),
            ReturnStatement: () => this.returnStatement(),
            LogicalExpression: () => this.logicalExpression(),
            JSXExpressionContainer: () => this.jsxExpressionContainer(),
            ArrayExpression: () => this.arrayExpression(),
            ArrayPattern: () => this.arrayPattern(),
            ArrowFunctionExpression: () => this.arrowFunctionExpression(),
            BinaryExpression: () => this.binaryExpression(),
            CallExpression: () => this.callExpression(),
            FunctionDeclaration: () => this.functionDeclaration(),
            Identifier: () => this.identifier(),
            ImportDefaultSpecifier: () => this.importDefaultSpecifier(),
            JSXAttribute: () => this.jsxAttribute(),
            JSXIdentifier: () => this.jsxIdentifier(),
            JSXOpeningElement: () => this.jsxOpeningElement(),
            JSXClosingElement: () => this.jsxClosingElement(),
            MemberExpression: () => this.memberExpression(),
            NullLiteral: () => this.nullLiteral(),
            NumericLiteral: () => this.numericLiteral(),
            ObjectExpression: () => this.objectExpression(),
            ObjectPattern: () => this.objectPattern(),
            ObjectProperty: () => this.objectProperty(),
            StringLiteral: () => this.stringLiteral(),
            VariableDeclaration: () => this.variableDeclaration(),
            VariableDeclarator: () => this.variableDeclarator(),
        };
    }
    process(node) {
        this.currNode = node;
        if (!node || !Object.keys(this.typeFns).includes(this.currNode.type)) {
            return node;
        }
        return this.typeFns[this.currNode.type]();
    }
    blockStatement() {
        return {
            next: this.currNode.body,
        };
    }
    returnStatement() {
        return {
            next: this.currNode.argument,
        };
    }
    jsxExpressionContainer() {
        return {
            next: this.currNode.expression,
        };
    }
    logicalExpression() {
        if (this.currNode.operator === "&&") {
            return {
                openingTag: "{#if " + this.currNode.left.name + "}",
                next: this.currNode.right,
                closingTag: "{/if}",
            };
        }
    }
    file() {
        return {
            next: this.currNode.program,
        };
    }
    program() {
        return {
            next: this.currNode.body,
        };
    }
    exportDefaultDeclaration() {
        return {
            next: this.currNode.declaration.body,
        };
    }
    importDeclaration() {
        var _a;
        let importDeclaration = "import ";
        let importModule = this.currNode.source.value;
        const isShadImport = importModule === null || importModule === void 0 ? void 0 : importModule.toString().startsWith("@/components/ui");
        const isMultipleImport = this.currNode.specifiers.length > 1;
        const replaces = {
            "lucide-react": "lucide-svelte",
        };
        if (importModule === "react" ||
            (!isShadImport && !(importModule in replaces))) {
            return null;
        }
        if (importModule in replaces) {
            importModule = replaces[importModule];
        }
        if (isShadImport) {
            const componentName = (_a = importModule === null || importModule === void 0 ? void 0 : importModule.toString().split("/")) === null || _a === void 0 ? void 0 : _a.pop();
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
        }
        else {
            const specifiers = this.currNode.specifiers.map((s) => {
                return s.imported.name;
            });
            if (specifiers.length > 1) {
                importDeclaration += `{${specifiers.join(",")}}`;
            }
            else {
                importDeclaration += specifiers[0];
            }
            importDeclaration += ` from '${importModule}'`;
        }
        return {
            part: "script",
            next: importDeclaration + "\n",
        };
    }
    jsxText() {
        return this.currNode.value;
    }
    jsxElement() {
        return {
            next: [
                this.currNode.openingElement,
                ...this.currNode.children,
                this.currNode.closingElement,
            ],
        };
    }
    correctComponentName(memberExpression) {
        let name = "";
        if ("property" in memberExpression) {
            name = memberExpression.property.name;
        }
        else if ("name" in memberExpression) {
            name = memberExpression.name;
        }
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
    arrayExpression() {
        return {
            openingTag: "[",
            next: this.currNode.elements,
            closingTag: "]\n",
        };
    }
    arrayPattern() {
        return {
            next: this.currNode.elements,
        };
    }
    arrowFunctionExpression() {
        return {
            next: this.currNode.body,
        };
    }
    binaryExpression() {
        return {
            openingTag: "{",
            next: [this.currNode.left, "===", this.currNode.right],
            closingTag: "}",
        };
    }
    callExpression() {
        let name = this.currNode.callee.name;
        const nameCorrections = {
            useState: "$state",
        };
        if (name in nameCorrections) {
            name = nameCorrections[name];
        }
        return {
            openingTag: name + "(",
            next: this.currNode.arguments,
            closingTag: ")\n",
        };
    }
    functionDeclaration() {
        const name = this.currNode.id.name;
        if (name[0] == name[0].toUpperCase()) {
            return {
                openingTag: `{#snippet ${name}()}`,
                next: this.currNode.body,
                closingTag: "{/snippet}",
            };
        }
    }
    identifier() {
        return this.currNode.name;
    }
    importDefaultSpecifier() {
        return {
            next: this.currNode.local,
        };
    }
    jsxAttribute() {
        let name = this.currNode.name.name;
        const disabledAttrs = ["key"];
        if (disabledAttrs.includes(name)) {
            return null;
        }
        const replaces = {
            className: "class",
            htmlFor: "for",
        };
        if (name in replaces) {
            name = replaces[name];
        }
        if (name.startsWith("on")) {
            name = name.toLowerCase();
        }
        return {
            next: [name, "=", this.currNode.value],
        };
    }
    jsxIdentifier() {
        return this.currNode.name;
    }
    jsxOpeningElement() {
        return {
            openingTag: "<",
            next: [this.currNode.name, " ", ...this.currNode.attributes],
            closingTag: ">\n",
        };
    }
    jsxClosingElement() {
        return {
            openingTag: "</",
            next: this.currNode.name,
            closingTag: ">\n",
        };
    }
    memberExpression() {
        let openingTag = this.currNode.object.name;
        if (this.currNode.object.object) {
            openingTag = this.currNode.object.object.name;
        }
        return {
            openingTag: openingTag + "[",
            next: [this.currNode.object.property, "]", ".", this.currNode.property],
        };
    }
    nullLiteral() {
        return "null";
    }
    numericLiteral() {
        return this.currNode.value.toString();
    }
    objectExpression() {
        return {
            openingTag: "{",
            next: this.currNode.properties,
            closingTag: "},",
        };
    }
    objectPattern() {
        return this.currNode.properties;
    }
    objectProperty() {
        return {
            next: [this.currNode.key, ":", this.currNode.value, ","],
        };
    }
    stringLiteral() {
        return `"${this.currNode.value}"`;
    }
    variableDeclaration() {
        if (this.currNode.declarations.length > 1) {
            return {
                part: "script",
                openingTag: "let ",
                next: this.currNode.declarations[0],
            };
        }
        else {
            return {
                part: "script",
                openingTag: "const ",
                next: this.currNode.declarations,
            };
        }
    }
    variableDeclarator() {
        let varName = this.currNode.id.name;
        if (this.currNode.id.type === "ArrayPattern") {
            varName = this.currNode.id.elements[0].name;
        }
        return {
            openingTag: varName + " = ",
            next: this.currNode.init,
        };
    }
}
class FileManager {
    static writeToFile(filePath, content) {
        fs.writeFileSync(filePath, content, "utf8");
    }
    static readFromFile(filePath) {
        return fs.readFileSync(filePath, "utf8");
    }
}
class ReactToSvelte {
    constructor() {
        this.script = "";
        this.header = "";
        this.body = "";
        this.tagProcessor = new TagProcessor();
    }
    convert(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.clear();
            const reactScript = FileManager.readFromFile(filepath);
            const reactParsed = babelParser.parse(reactScript, {
                sourceType: "module",
                plugins: ["jsx", "typescript"],
            });
            FileManager.writeToFile(path.join(__dirname, "..", "output", "reactParsed.json"), JSON.stringify(reactParsed, null, 2));
            this.process(reactParsed);
        });
    }
    write(content, part) {
        if (part === "script") {
            this.script += content;
        }
        else if (part === "header") {
            this.header += content;
        }
        else {
            this.body += content;
        }
    }
    process(node, part = "body") {
        const nodeResult = this.tagProcessor.process(node);
        if (!nodeResult || nodeResult === null)
            return;
        if (typeof nodeResult === "string") {
            this.write(nodeResult, part);
        }
        else if (nodeResult && typeof nodeResult === "object") {
            if ("part" in nodeResult) {
                part = nodeResult.part;
            }
            if ("openingTag" in nodeResult) {
                this.write(nodeResult.openingTag, part);
            }
            if ("next" in nodeResult) {
                if (Array.isArray(nodeResult.next)) {
                    nodeResult.next.map((n) => {
                        this.process(n, part);
                    });
                }
                else {
                    this.process(nodeResult.next, part);
                }
            }
            if ("closingTag" in nodeResult) {
                this.write(nodeResult.closingTag, part);
            }
        }
    }
    export(filename) {
        let result = "";
        if (this.script.length > 0) {
            result += `
      <script lang="ts">
      ${this.script}
      </script>\n`;
        }
        result += `${this.body}\n`;
        if (this.header) {
            result += `      
      <svelte:head>
        ${this.header}
      </svelte:head>
    `;
        }
        FileManager.writeToFile(filename, result);
    }
    clear() {
        this.script = "";
        this.header = "";
        this.body = "";
    }
}
const converter = new ReactToSvelte();
const inputPath = path.join(__dirname, "..", "input", "react.tsx");
converter.convert(inputPath);
const outputPath = path.join(__dirname, "..", "output", "result.svelte");
converter.export(outputPath);
