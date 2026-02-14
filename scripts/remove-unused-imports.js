#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Function to get all TypeScript/TSX files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules'
    ) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to extract imports from a file
function extractImports(content) {
  const importRegex =
    /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"][^'"]+['"];?/g;
  const cssImportRegex = /import\s+['"][^'"]*\.css['"];?/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[0]);
  }

  // Also capture CSS imports - we want to keep these
  while ((match = cssImportRegex.exec(content)) !== null) {
    imports.push(match[0]);
  }

  return imports;
}

// Function to extract used identifiers from content
function extractUsedIdentifiers(content) {
  // Remove imports and comments to avoid false positives, but keep CSS imports
  const contentWithoutImports = content.replace(
    /import\s+(?!.*\.css['"])[^;]*?from\s+['"][^'"]+['"];?/g,
    ''
  );
  const contentWithoutComments = contentWithoutImports.replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    ''
  );

  // Extract identifiers (variable names, function names, etc.)
  const identifiers = new Set();

  // Match function calls, variable references, type references
  const identifierRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match;

  while ((match = identifierRegex.exec(contentWithoutComments)) !== null) {
    const identifier = match[1];
    // Filter out common keywords and literals
    if (
      ![
        'const',
        'let',
        'var',
        'function',
        'class',
        'interface',
        'type',
        'export',
        'default',
        'return',
        'if',
        'else',
        'for',
        'while',
        'do',
        'switch',
        'case',
        'break',
        'continue',
        'try',
        'catch',
        'finally',
        'throw',
        'new',
        'this',
        'super',
        'typeof',
        'instanceof',
        'void',
        'delete',
        'in',
        'of',
        'as',
        'from',
        'import',
        'true',
        'false',
        'null',
        'undefined',
      ].includes(identifier)
    ) {
      identifiers.add(identifier);
    }
  }

  return identifiers;
}

// Function to parse import statement and get imported names
function parseImportStatement(importStatement) {
  const fromMatch = importStatement.match(/from\s+['"][^'"]+['"]/);
  if (!fromMatch) return null;

  const fromPath = fromMatch[0].replace(/from\s+['"]/g, '').replace(/['"]/, '');
  const importPart = importStatement
    .replace(/from\s+['"][^'"]+['"];?/, '')
    .replace('import', '')
    .trim();

  const importedNames = [];

  if (importPart.includes('*')) {
    // Namespace import
    const match = importPart.match(/\*\s+as\s+(\w+)/);
    if (match) importedNames.push(match[1]);
  } else if (importPart.includes('{')) {
    // Named imports
    const namedImports = importPart.match(/{([^}]*)}/);
    if (namedImports) {
      const names = namedImports[1].split(',').map((name) => {
        const trimmed = name.trim();
        if (trimmed.includes(' as ')) {
          return trimmed.split(' as ')[1].trim();
        }
        return trimmed;
      });
      importedNames.push(...names);
    }
  } else if (importPart) {
    // Default import
    importedNames.push(importPart);
  }

  return { fromPath, importedNames };
}

// Function to check if import is used
function isImportUsed(importStatement, usedIdentifiers) {
  // Always keep CSS imports
  if (importStatement.includes('.css')) {
    return true;
  }

  const parsed = parseImportStatement(importStatement);
  if (!parsed) return false;

  return parsed.importedNames.some((name) => usedIdentifiers.has(name));
}

// Function to remove unused imports from content
function removeUnusedImports(content) {
  const lines = content.split('\n');
  const usedIdentifiers = extractUsedIdentifiers(content);
  const imports = extractImports(content);

  let removedCount = 0;
  const newLines = lines.filter((line) => {
    const trimmedLine = line.trim();

    // Check if it's an import line
    if (trimmedLine.startsWith('import ')) {
      // Find the complete import statement (might span multiple lines)
      let fullImport = trimmedLine;
      let i = lines.indexOf(line);

      // Handle multi-line imports
      while (i < lines.length - 1 && !fullImport.endsWith(';')) {
        i++;
        fullImport += ' ' + lines[i].trim();
      }

      if (!isImportUsed(fullImport, usedIdentifiers)) {
        removedCount++;
        // Skip all lines that are part of this import
        return false;
      }
    }

    return true;
  });

  return { content: newLines.join('\n'), removedCount };
}

// Main function
function main() {
  log('🔍 Scanning for unused imports...', colors.cyan);

  const srcDir = path.join(__dirname, '..', 'src');
  const tsFiles = getAllTsFiles(srcDir);

  log(`📁 Found ${tsFiles.length} TypeScript files`, colors.blue);

  let totalRemoved = 0;
  let filesModified = 0;

  tsFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: newContent, removedCount } =
        removeUnusedImports(content);

      if (removedCount > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        log(
          `✅ ${filePath}: Removed ${removedCount} unused import(s)`,
          colors.green
        );
        totalRemoved += removedCount;
        filesModified++;
      }
    } catch (error) {
      log(`❌ Error processing ${filePath}: ${error.message}`, colors.red);
    }
  });

  log('\n📊 Summary:', colors.cyan);
  log(`   Files processed: ${tsFiles.length}`, colors.blue);
  log(`   Files modified: ${filesModified}`, colors.yellow);
  log(`   Total imports removed: ${totalRemoved}`, colors.green);

  if (totalRemoved > 0) {
    log('\n🎉 Successfully cleaned up unused imports!', colors.green);
    log('💡 Run your linter to format the files if needed', colors.blue);
  } else {
    log('\n✨ No unused imports found!', colors.green);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getAllTsFiles,
  extractImports,
  extractUsedIdentifiers,
  removeUnusedImports,
};
