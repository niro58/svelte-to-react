import * as babelParser from "@babel/parser";
import * as fs from "fs";
import * as path from "path";
class TagProcessor {
  shadMultipleImportComponents: string[];
  typeFns;

  currNode: any;

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
  process(node: any) {
    this.currNode = node;

    if (!node || !Object.keys(this.typeFns).includes(this.currNode.type)) {
      return node;
    }
    return this.typeFns[this.currNode.type as keyof typeof this.typeFns]();
  }

  private blockStatement() {
    return {
      next: this.currNode.body,
    };
  }
  private returnStatement() {
    return {
      next: this.currNode.argument,
    };
  }

  private jsxExpressionContainer() {
    return {
      next: this.currNode.expression,
    };
  }
  private logicalExpression() {
    if (this.currNode.operator === "&&") {
      return {
        openingTag: "{#if " + this.currNode.left.name + "}",
        next: this.currNode.right,
        closingTag: "{/if}",
      };
    }
  }
  private file() {
    return {
      next: this.currNode.program,
    };
  }
  private program() {
    return {
      next: this.currNode.body,
    };
  }
  private exportDefaultDeclaration() {
    return {
      next: this.currNode.declaration.body,
    };
  }
  private importDeclaration() {
    let importDeclaration = "import ";
    let importModule = this.currNode.source.value;

    const isShadImport = importModule?.toString().startsWith("@/components/ui");
    const isMultipleImport = this.currNode.specifiers.length > 1;
    const replaces = {
      "lucide-react": "lucide-svelte",
    };

    if (
      importModule === "react" ||
      (!isShadImport && !(importModule in replaces))
    ) {
      return null;
    }
    if (importModule in replaces) {
      importModule = replaces[importModule as keyof typeof replaces];
    }

    if (isShadImport) {
      const componentName = importModule?.toString().split("/")?.pop();
      if (!componentName) return;
      const componentNameUppercased =
        componentName.charAt(0).toUpperCase() + componentName.slice(1);

      if (isMultipleImport) {
        this.shadMultipleImportComponents.push(componentName);
        importDeclaration += `* as ${componentNameUppercased} from '$lib/components/ui/${componentName}/index.js'`;
      } else {
        importDeclaration += `${componentNameUppercased} from '$lib/components/ui/${componentName}/${componentName}.svelte'`;
      }
      importDeclaration += ";";
    } else {
      const specifiers = this.currNode.specifiers.map((s: any) => {
        return s.imported.name;
      });
      if (specifiers.length > 1) {
        importDeclaration += `{${specifiers.join(",")}}`;
      } else {
        importDeclaration += specifiers[0];
      }
      importDeclaration += ` from '${importModule}'`;
    }

    return {
      part: "script",
      next: importDeclaration + "\n",
    };
  }
  jsxText(): string {
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

  private correctComponentName(memberExpression: any) {
    let name = "";
    if ("property" in memberExpression) {
      name = memberExpression.property.name;
    } else if ("name" in memberExpression) {
      name = memberExpression.name;
    }

    if (name[0] === name[0].toLowerCase()) {
      return name;
    }

    const res = name.split(/(?=[A-Z])/);
    if (res.length === 1) {
      if (this.shadMultipleImportComponents.includes(name)) {
        return `${name}.Root`;
      } else {
        return name;
      }
    } else {
      return res.join(".");
    }
  }
  private arrayExpression() {
    return {
      openingTag: "[",
      next: this.currNode.elements,
      closingTag: "]\n",
    };
  }
  private arrayPattern() {
    return {
      next: this.currNode.elements,
    };
  }
  private arrowFunctionExpression() {
    return {
      next: this.currNode.body,
    };
  }
  private binaryExpression() {
    return {
      openingTag: "{",
      next: [this.currNode.left, "===", this.currNode.right],
      closingTag: "}",
    };
  }
  private callExpression() {
    let name = this.currNode.callee.name;
    const nameCorrections = {
      useState: "$state",
    };
    if (name in nameCorrections) {
      name = nameCorrections[name as keyof typeof nameCorrections];
    }

    return {
      openingTag: name + "(",
      next: this.currNode.arguments,
      closingTag: ")\n",
    };
  }
  private functionDeclaration() {
    const name = this.currNode.id.name;
    if (name[0] == name[0].toUpperCase()) {
      return {
        openingTag: `{#snippet ${name}()}`,
        next: this.currNode.body,
        closingTag: "{/snippet}",
      };
    }
  }
  private identifier() {
    return this.currNode.name;
  }
  private importDefaultSpecifier() {
    return {
      next: this.currNode.local,
    };
  }
  private jsxAttribute() {
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
      name = replaces[name as keyof typeof replaces];
    }
    if (name.startsWith("on")) {
      name = name.toLowerCase();
    }

    return {
      next: [name, "=", this.currNode.value],
    };
  }
  private jsxIdentifier() {
    return this.currNode.name;
  }
  private jsxOpeningElement() {
    return {
      openingTag: "<",
      next: [this.currNode.name, " ", ...this.currNode.attributes],
      closingTag: ">\n",
    };
  }
  private jsxClosingElement() {
    return {
      openingTag: "</",
      next: this.currNode.name,
      closingTag: ">\n",
    };
  }
  private memberExpression() {
    let openingTag = this.currNode.object.name;

    if (this.currNode.object.object) {
      openingTag = this.currNode.object.object.name;
    }
    return {
      openingTag: openingTag + "[",
      next: [this.currNode.object.property, "]", ".", this.currNode.property],
    };
  }
  private nullLiteral() {
    return "null";
  }
  private numericLiteral() {
    return this.currNode.value.toString();
  }
  private objectExpression() {
    return {
      openingTag: "{",
      next: this.currNode.properties,
      closingTag: "},",
    };
  }
  private objectPattern() {
    return this.currNode.properties;
  }
  private objectProperty() {
    return {
      next: [this.currNode.key, ":", this.currNode.value, ","],
    };
  }
  private stringLiteral() {
    return `"${this.currNode.value}"`;
  }
  private variableDeclaration() {
    if (this.currNode.declarations.length > 1) {
      return {
        part: "script",
        openingTag: "let ",
        next: this.currNode.declarations[0],
      };
    } else {
      return {
        part: "script",
        openingTag: "const ",
        next: this.currNode.declarations,
      };
    }
  }
  private variableDeclarator() {
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
  static writeToFile(filePath: string, content: string) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  static readFromFile(filePath: string) {
    return fs.readFileSync(filePath, "utf8");
  }
}
class ReactToSvelte {
  script = "";
  header = "";
  body = "";
  tagProcessor = new TagProcessor();
  constructor() {}
  async convert(filepath: string) {
    this.clear();
    const reactScript = FileManager.readFromFile(filepath);
    const reactParsed = babelParser.parse(reactScript, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
    FileManager.writeToFile(
      path.join(__dirname, "..", "output", "reactParsed.json"),
      JSON.stringify(reactParsed, null, 2)
    );
    this.process(reactParsed);
  }
  private write(content: string, part: "script" | "body" | "header") {
    if (part === "script") {
      this.script += content;
    } else if (part === "header") {
      this.header += content;
    } else {
      this.body += content;
    }
  }
  private process(node: any, part: "script" | "body" | "header" = "body") {
    const nodeResult = this.tagProcessor.process(node);
    if (!nodeResult || nodeResult === null) return;

    if (typeof nodeResult === "string") {
      this.write(nodeResult, part);
    } else if (nodeResult && typeof nodeResult === "object") {
      if ("part" in nodeResult) {
        part = nodeResult.part;
      }

      if ("openingTag" in nodeResult) {
        this.write(nodeResult.openingTag, part);
      }
      if ("next" in nodeResult) {
        if (Array.isArray(nodeResult.next)) {
          nodeResult.next.map((n: any) => {
            this.process(n, part);
          });
        } else {
          this.process(nodeResult.next, part);
        }
      }
      if ("closingTag" in nodeResult) {
        this.write(nodeResult.closingTag, part);
      }
    }
  }
  export(filename: string) {
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
  private clear() {
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
