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
  private conditionalExpression(n: any) {}
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
      if (this.shadMultipleImportComponents.includes(name.toLowerCase())) {
        return `${name}.Root`;
      } else {
        return name;
      }
    } else {
      return res.join(".");
    }
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
let result = "";
function reactToSvelte(node: any) {
  const nodeResult = tagProcessor.process(node);
  if (!nodeResult || nodeResult === null) return;

  if (typeof nodeResult === "string") {
    result += nodeResult + "\n";
  } else if (nodeResult && typeof nodeResult === "object") {
    if ("openingTag" in nodeResult) {
      result += nodeResult.openingTag + "\n";
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
      result += nodeResult.closingTag + "\n";
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
const outputPath = path.join(__dirname, "..", "output", "result.svelte");
reactToSvelte(reactParsed);

FileManager.writeToFile(outputPath, result);
