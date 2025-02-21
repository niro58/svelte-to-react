import * as babelParser from "@babel/parser";
import * as fs from "fs";
import * as path from "path";
class TagProcessor {
  shadMultipleImportComponents: string[];
  typeFns;

  constructor() {
    this.shadMultipleImportComponents = [];
    this.typeFns = {
      File: (node: any) => this.file(node),
      ImportDeclaration: (node: any) => this.importDeclaration(node),
      ExportDefaultDeclaration: (node: any) =>
        this.exportDefaultDeclaration(node),
      JSXElement: (node: any) => this.jsxElement(node),
      JSXText: (node: any) => this.jsxText(node),
      Program: (node: any) => this.program(node),
      BlockStatement: (node: any) => this.blockStatement(node),
      ReturnStatement: (node: any) => this.returnStatement(node),
      LogicalExpression: (node: any) => this.logicalExpression(node),
      ConditionalExpression: (node: any) => this.conditionalExpression(node),
      JSXExpressionContainer: (node: any) => this.jsxExpressionContainer(node),
      ArrayExpression: (node: any) => this.arrayExpression(node),
      ArrayPattern: (node: any) => this.arrayPattern(node),
      ArrowFunctionExpression: (node: any) =>
        this.arrowFunctionExpression(node),
      BinaryExpression: (node: any) => this.binaryExpression(node),
      CallExpression: (node: any) => this.callExpression(node),
      ExpressionStatement: (node: any) => this.expressionStatement(node),
      FunctionDeclaration: (node: any) => this.functionDeclaration(node),
      Identifier: (node: any) => this.identifier(node),
      ImportDefaultSpecifier: (node: any) => this.importDefaultSpecifier(node),
      ImportSpecifier: (node: any) => this.importSpecifier(node),
      JSXAttribute: (node: any) => this.jsxAttribute(node),
      JSXClosingElement: (node: any) => this.jsxClosingElement(node),
      JSXClosingFragment: (node: any) => this.jsxClosingFragment(node),
      JSXFragment: (node: any) => this.jsxFragment(node),
      JSXIdentifier: (node: any) => this.jsxIdentifier(node),
      JSXOpeningElement: (node: any) => this.jsxOpeningElement(node),
      JSXOpeningFragment: (node: any) => this.jsxOpeningFragment(node),
      JSXSpreadAttribute: (node: any) => this.jsxSpreadAttribute(node),
      MemberExpression: (node: any) => this.memberExpression(node),
      NullLiteral: (node: any) => this.nullLiteral(node),
      NumericLiteral: (node: any) => this.numericLiteral(node),
      ObjectExpression: (node: any) => this.objectExpression(node),
      ObjectPattern: (node: any) => this.objectPattern(node),
      ObjectProperty: (node: any) => this.objectProperty(node),
      StringLiteral: (node: any) => this.stringLiteral(node),
      VariableDeclaration: (node: any) => this.variableDeclaration(node),
      VariableDeclarator: (node: any) => this.variableDeclarator(node),
    };
  }
  blockStatement(n: any) {
    return {
      next: n.body,
    };
  }
  returnStatement(n: any) {
    return {
      next: n.argument,
    };
  }
  process(node: any) {
    if (!node || !Object.keys(this.typeFns).includes(node.type)) return;
    return this.typeFns[node.type as keyof typeof this.typeFns](node);
  }
  private jsxExpressionContainer(n: any) {
    return {
      next: n.expression,
    };
  }
  private conditionalExpression(n: any) {
    return {};
  }
  private logicalExpression(n: any) {
    if (n.operator === "&&") {
      return {
        openingTag: "{#if " + n.left.name + "}",
        next: n.right,
        closingTag: "{/if}",
      };
    }
  }
  private file(n: any) {
    return {
      next: n.program,
    };
  }
  private program(n: any) {
    return {
      openingTag: "<script lang='ts'>",
      next: n.body,
    };
  }
  private exportDefaultDeclaration(n: any) {
    return {
      next: n.declaration.body,
      openingTag: "</script>",
    };
  }
  private importDeclaration(n: any) {
    let importDeclaration = "import ";
    const value = n.source.value;

    const isShadImport = value?.toString().startsWith("@/components/ui");
    const isMultipleImport = n.specifiers.length > 1;

    if (value === "react" || !isShadImport) {
      return null;
    }

    const componentName = value?.toString().split("/")?.pop();
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
    return importDeclaration;
  }
  jsxText(n: any): string {
    return n.value;
  }
  jsxElement(n: any) {
    const componentName = this.correctComponentName(n.openingElement.name.name);
    return {
      openingTag: `<${componentName}${this.getAttributes(
        n.openingElement.attributes
      )}>`,
      next: n.children,
      closingTag: `</${componentName}>`,
    };
  }

  private getAttributes(attributes: any): string {
    if (!attributes) return "";

    let att: string[] = [];
    attributes.map((a: any) => {
      const name: string = a.name.name;
      const value = a.value.value;

      if (name === "className") {
        att.push(`class="${value}"`);
      } else if (name === "htmlFor") {
        att.push(`for="${value}"`);
      } else if (name.startsWith("on")) {
        att.push(`${name.toLowerCase()}={()=>{}}`);
      } else {
        att.push(`${name}="${value}"`);
      }
    });
    return " " + att.join(" ");
  }
  private correctComponentName(name: string) {
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
  private arrayExpression(node: any) {
    return {
      next: node.elements,
    };
  }
  private arrayPattern(node: any) {
    return {
      next: node.elements,
    };
  }
  private arrowFunctionExpression(node: any) {
    return {
      next: node.body,
    };
  }
  private binaryExpression(node: any) {}
  private callExpression(node: any) {}
  private expressionStatement(node: any) {}
  private functionDeclaration(node: any) {}
  private identifier(node: any) {
    return node.name;
  }
  private importDefaultSpecifier(node: any) {
    return {
      next: node.local,
    };
  }
  private importSpecifier(node: any) {}
  private jsxAttribute(node: any) {}
  private jsxClosingElement(node: any) {}
  private jsxClosingFragment(node: any) {}
  private jsxFragment(node: any) {}
  private jsxIdentifier(node: any) {}
  private jsxOpeningElement(node: any) {}
  private jsxOpeningFragment(node: any) {}
  private jsxSpreadAttribute(node: any) {}
  private memberExpression(node: any) {}
  private nullLiteral(node: any) {
    return "null";
  }
  private numericLiteral(node: any) {
    return node.value.toString();
  }
  private objectExpression(node: any) {
    return {
      next: node.properties,
    };
  }
  private objectPattern(node: any) {
    return node.properties;
  }
  private objectProperty(node: any) {}
  private stringLiteral(node: any) {
    return node.value;
  }
  private variableDeclaration(node: any) {
    if (node.declarations.length > 1) {
      return {
        openingTag: "let ",
        next: node.declarations,
      };
    } else {
      return {
        openingTag: "const ",
        next: node.declarations,
      };
    }
  }
  private variableDeclarator(node: any) {
    return {
      openingTag: node.id.name + " = ",
      next: node.init,
    };
  }
}
class FileManager {
  static writeToFile(filePath: string, content: string) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Writing to ${filePath}`);
  }
  static readFromFile(filePath: string) {
    return fs.readFileSync(filePath, "utf8");
  }
}
const reactScript = FileManager.readFromFile(
  path.join(__dirname, "..", "input", "react.tsx")
);

let tagProcessor = new TagProcessor();
let script = "";
let header = "";
let body = "";

function reactToSvelte(node: any) {
  const nodeResult = tagProcessor.process(node);
  if (!nodeResult || nodeResult === null) return;

  if (typeof nodeResult === "string") {
    // result += nodeResult + "\n";
  } else if (nodeResult && typeof nodeResult === "object") {
    if ("openingTag" in nodeResult) {
      // result += nodeResult.openingTag + "\n";
    }
    if ("next" in nodeResult) {
      if (Array.isArray(nodeResult.next)) {
        nodeResult.next.map((n: any) => {
          reactToSvelte(n);
        });
      } else {
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
FileManager.writeToFile(
  path.join(__dirname, "..", "output", "reactParsed.json"),
  JSON.stringify(reactParsed, null, 2)
);
// const outputPath = path.join(__dirname, "..", "output", "result.svelte");
reactToSvelte(reactParsed);

// FileManager.writeToFile(outputPath, result);
