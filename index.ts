import {ImportDeclaration, ImportSpecifier, Project, QuoteKind, SourceFile} from 'ts-morph';
import path from "path";

function findLodashUsages(importDeclaration: ImportDeclaration, sourceFile: SourceFile) {
    const usages: string[] = [];
    const regex = /_\.([a-zA-Z0-9_]+)/g;
    sourceFile.forEachDescendant(node => {

        if (node.getKindName() === 'PropertyAccessExpression' && node.getText().startsWith('_.')) {
            const match = regex.exec(node.getText());
            if (match?.[1]) {
                usages.push(match[1]);
            }
        }
    })

    return usages;
}

function replaceLodashUsages(sourceFile: SourceFile, usages: string[]) {
    usages.forEach(usage => {
        sourceFile.forEachDescendant(node => {
            if (node.getKindName() === 'PropertyAccessExpression' && node.getText() === `_.${usage}`) {
                node.replaceWithText(usage);
            }
        });
    });
}

function handleDefaultImport(importDeclaration: ImportDeclaration, sourceFile: SourceFile) {
    // Find all usages of _ in the file
    const usages = findLodashUsages(importDeclaration, sourceFile);
    // Create named imports for each unique usage
    const uniqueUsages = Array.from(new Set(usages));

    if (uniqueUsages.length === 0) {
        return;
    }

    uniqueUsages.forEach(usage => {
        sourceFile.addImportDeclaration({
            defaultImport: usage,
            moduleSpecifier: `lodash/${usage}`
        });
    });

    // Remove the old lodash import declaration
    importDeclaration.remove();

    // Replace _.usage with usage
    replaceLodashUsages(sourceFile, usages);
}

function handleNamedImports(importDeclaration: ImportDeclaration, namedImports: ImportSpecifier[]) {
    namedImports.forEach(namedImport => {
        const newModuleSpecifier = `lodash/${namedImport.getName()}`;
        importDeclaration.getSourceFile().addImportDeclaration({
            defaultImport: namedImport.getName(),
            moduleSpecifier: newModuleSpecifier
        });
    });

    // Remove the old lodash named import declaration
    importDeclaration.remove();
}


function refactorLodashImports() {
    const projectPath = process.argv[2]
    const project = new Project({
        tsConfigFilePath: path.join(projectPath, 'tsconfig.json'),
        manipulationSettings: {
            quoteKind: QuoteKind.Single
        }
    });

    const sourceFiles = project.getSourceFiles();

    sourceFiles.forEach(sourceFile => {
        const lodashImports = sourceFile.getImportDeclarations()
            .filter(importDeclaration => importDeclaration.getModuleSpecifierValue() === 'lodash' || importDeclaration.getModuleSpecifierValue() === 'lodash/fp');

        lodashImports.forEach(importDeclaration => {
            const defaultImport = importDeclaration.getDefaultImport();
            const namedImports = importDeclaration.getNamedImports();
            if (defaultImport && defaultImport.getText() === '_') {
                // Handle default imports (e.g., import _ from 'lodash')
                handleDefaultImport(importDeclaration, sourceFile);
            } else if (namedImports.length > 0) {
                // Handle named imports (e.g., import { filter } from 'lodash')
                handleNamedImports(importDeclaration, namedImports);
            }
        });
    });

    project.saveSync()
}

// Run the script
refactorLodashImports();

