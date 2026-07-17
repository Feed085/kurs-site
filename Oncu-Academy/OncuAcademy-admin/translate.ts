import { Project, SyntaxKind, JsxText, StringLiteral, Node } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.tsx");

const filesToProcess = ['AppAdmin.tsx', 'AdminExamPanel.tsx', 'AdminExamHistoryDetail.tsx'];

const azRegex = /[əıöüşçğƏIÖÜŞÇĞ]/;

function shouldTranslate(text: string) {
  // If it contains AZ specific chars, definitely translate
  if (azRegex.test(text)) return true;
  return false; // we are only automatically translating strings that look like Azerbaijani
}

function processFile(fileName: string) {
  const sourceFile = project.getSourceFileOrThrow(fileName);
  let importAdded = false;

  const importDecs = sourceFile.getImportDeclarations();
  const hasI18nImport = importDecs.some(imp => imp.getModuleSpecifierValue() === 'react-i18next');
  if (!hasI18nImport) {
    sourceFile.addImportDeclaration({
      namedImports: ['useTranslation'],
      moduleSpecifier: 'react-i18next'
    });
    importAdded = true;
  }

  // JsxText
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  // Iterate in reverse to avoid messing up offsets
  for (const jsxText of jsxTexts.reverse()) {
    const text = jsxText.getLiteralText().trim();
    if (text && shouldTranslate(text)) {
      const key = `admin.` + text.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20).toLowerCase();
      jsxText.replaceWithText(`{t('${key}', { defaultValue: '${text}' })}`);
    }
  }

  // StringLiterals
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const literal of stringLiterals.reverse()) {
    const text = literal.getLiteralValue().trim();
    if (text && shouldTranslate(text)) {
      const parent = literal.getParent();
      const key = `admin.` + text.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20).toLowerCase();
      
      if (Node.isJsxAttribute(parent)) {
         literal.replaceWithText(`{t('${key}', { defaultValue: '${text}' })}`);
      } else if (Node.isCallExpression(parent) || Node.isPropertyAssignment(parent) || Node.isReturnStatement(parent) || Node.isVariableDeclaration(parent) || Node.isBinaryExpression(parent)) {
         // basic code
         literal.replaceWithText(`t('${key}', { defaultValue: '${text}' })`);
      }
    }
  }

  // Add the hook to functional components
  const functions = sourceFile.getFunctions();
  for (const func of functions) {
     if (func.isDefaultExport() || (func.getName() && func.getName()?.match(/^[A-Z]/))) {
         const body = func.getBody();
         if (Node.isBlock(body)) {
             const statements = body.getStatements();
             const hasTranslation = statements.some(s => s.getText().includes('useTranslation'));
             if (!hasTranslation) {
                 body.insertStatements(0, "const { t } = useTranslation();");
             }
         }
     }
  }
  
  // also look for arrow functions assigned to variables that start with capital letter
  const varDecls = sourceFile.getVariableDeclarations();
  for (const varDecl of varDecls) {
      if (varDecl.getName().match(/^[A-Z]/)) {
          const init = varDecl.getInitializer();
          if (Node.isArrowFunction(init)) {
              const body = init.getBody();
              if (Node.isBlock(body)) {
                  const statements = body.getStatements();
                  const hasTranslation = statements.some(s => s.getText().includes('useTranslation'));
                  if (!hasTranslation) {
                      body.insertStatements(0, "const { t } = useTranslation();");
                  }
              }
          }
      }
  }

  sourceFile.saveSync();
  console.log(`Processed ${fileName}`);
}

for (const file of filesToProcess) {
  try {
     processFile(file);
  } catch (e) {
     console.error(`Error processing ${file}:`, e);
  }
}
