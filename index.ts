import {ImportDeclaration, ImportSpecifier, Project, SourceFile} from 'ts-morph';
import path from "path";

function refactorLodashImports() {
    const projectPath= '../BundleSizeTest';
    const project = new Project({
        tsConfigFilePath:  path.join(projectPath, 'tsconfig.json'),
    });

    const sourceFiles = project.getSourceFiles();

    sourceFiles.forEach(sourceFile => {
        const lodashImports = sourceFile.getImportDeclarations()
            .filter(importDeclaration => importDeclaration.getModuleSpecifierValue() === 'lodash');

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

function findLodashUsages(importDeclaration: ImportDeclaration) {
    const usages:string[] = [];
    const lodashIdentifier = importDeclaration.getDefaultImport();

    if (lodashIdentifier) {
        const references = lodashIdentifier.findReferencesAsNodes();
        references.forEach(reference => {
            const parent = reference.getParent();

            if (parent && parent.getKindName() === 'PropertyAccessExpression') {
                usages.push(parent.getText());
            }
        });
    }

    return usages;
}

function replaceLodashUsages(sourceFile :SourceFile, usages:string[]) {
    usages.forEach(usage => {
        sourceFile.forEachDescendant(node => {
            if (node.getKindName() === 'PropertyAccessExpression' && node.getText() === `_.${usage}`) {
                node.replaceWithText(usage);
            }
        });
    });
}

function handleDefaultImport(importDeclaration: ImportDeclaration, sourceFile:SourceFile) {
    // Find all usages of _ in the file
    const usages = findLodashUsages(importDeclaration);

    // Create named imports for each unique usage
    const uniqueUsages = Array.from(new Set(usages));
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

// Run the script
refactorLodashImports();

