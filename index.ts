import * as fs from "fs";
import * as path from "path";
import esprima, { ImportDeclaration } from "esprima-next";

const reactScript = `
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function BillingPage() {
  const [amount, setAmount] = useState("")

  const handleRefill = () => {
    // Here you would typically integrate with a payment provider
    // and update the user's balance on the server
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Refill Balance</CardTitle>
          <CardDescription>Add funds to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="Enter amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefill} className="w-full">
            Refill Balance
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
`;

const res = esprima.parseScript(reactScript, {
  tolerant: true,
  jsx: true,
});
const body = res.body;
const headerImports = body.filter((node) => node.type === "ImportDeclaration");
const bodyNodes = body.filter(
  (node) => node.type !== "ExportDefaultDeclaration"
);
let shadMultipleImportComponents: string[] = [];
function createHeader() {
  let header = "";

  header += '<script lang="ts">\n';

  headerImports.map((node: ImportDeclaration) => {
    let importDeclaration = "";
    const value = node.source.value;
    if (value === "react") return;
    const isShadImport = value?.toString().startsWith("@/components/ui");
    const isMultipleImport = node.specifiers.length > 1;

    importDeclaration += "import ";
    if (isShadImport) {
      const componentName = value?.toString().split("/")?.pop();
      if (!componentName) return;
      const componentNameUppercased =
        componentName.charAt(0).toUpperCase() + componentName.slice(1);

      if (isMultipleImport) {
        shadMultipleImportComponents.push(componentName);
        importDeclaration += `* as ${componentNameUppercased} from '$lib/components/ui/${componentName}/index.js'`;
      } else {
        importDeclaration += `${componentNameUppercased} from '$lib/components/ui/${componentName}/${componentName}.svelte'`;
      }
    }

    header += importDeclaration + "\n";
  });

  header += "</script>\n";
  return header;
}

function writeToFile(filePath: string, content: string) {
  //   fs.writeFileSync(filePath, "", "utf8");
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Writing to ${filePath}`);
  console.log(content);
}
const outputPath = path.join(__dirname, "..", "output", "result.svelte");
// writeToFile(outputPath, createBody());

const test = {
  type: "JSXElement",
  openingElement: {
    type: "JSXOpeningElement",
    name: { type: "JSXIdentifier", name: "div" },
    selfClosing: false,
    attributes: [
      {
        type: "JSXAttribute",
        name: { type: "JSXIdentifier", name: "className" },
        value: {
          type: "Literal",
          value: "container mx-auto px-4 py-8",
          raw: '"container mx-auto px-4 py-8"',
        },
      },
    ],
  },
  children: [
    { type: "JSXText", value: "\n      ", raw: "\n      " },
    {
      type: "JSXElement",
      openingElement: {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name: "h1" },
        selfClosing: false,
        attributes: [
          {
            type: "JSXAttribute",
            name: {
              type: "JSXIdentifier",
              name: "className",
            },
            value: {
              type: "Literal",
              value: "text-3xl font-bold mb-6",
              raw: '"text-3xl font-bold mb-6"',
            },
          },
        ],
      },
      children: [{ type: "JSXText", value: "Billing", raw: "Billing" }],
      closingElement: {
        type: "JSXClosingElement",
        name: { type: "JSXIdentifier", name: "h1" },
      },
    },
  ],
  closingElement: {
    type: "JSXClosingElement",
    name: { type: "JSXIdentifier", name: "div" },
  },
};
let result = "";
function correctComponentName(name: string) {
  const res = name.split(/(?=[A-Z])/);
  if (res.length === 1) {
    if (shadMultipleImportComponents.includes(name)) {
      return `${name}.Root`;
    }
  } else {
    return res.join(".");
  }
  console.log(res);
}
function getAttributes(attributes: any) :string{
  let res = ""
  attributes.map((a:any)=>{
    const name = a.name.name 
    const value = a.value.value
    
    if(name === "className"){
      res += `class="${value}"`; 
    }
  })
  return res
}
function deepSearch(v: any) {
  if (typeof v === "string") {
    return v;
  }
  if (v.type === "JSXText") {
    result += v.value;
  } else if (v.type === "JSXElement") {
    result += `<${v.openingElement.name.name}>`;
    v.children.map((i: any) => {
      deepSearch(i);
    });
    result += `</${v.openingElement.name.name}>`;
  }
}
console.log(correctComponentName("Card"));
// deepSearch(test);
// writeToFile(outputPath, result);
