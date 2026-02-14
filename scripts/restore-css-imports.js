#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

// Common CSS imports that should be preserved
const essentialCSSImports = [
  {
    file: 'src/app/layout.tsx',
    imports: [
      "import 'react-toastify/dist/ReactToastify.css';",
      "import 'rsuite-table/dist/css/rsuite-table.css';",
    ],
  },
  {
    file: 'src/app/globals.css',
    imports: ["@import './css/table.css';"],
  },
  {
    file: 'src/components/CustomDateRangePicker.tsx',
    imports: ["import 'flatpickr/dist/themes/light.css';"],
  },
  {
    file: 'src/components/WhatsAppShareButton.tsx',
    imports: ["import './WhatsAppShareButton.css';"],
  },
];

// Function to check if import exists in file
function hasImport(filePath, importStatement) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(importStatement);
  } catch (error) {
    return false;
  }
}

// Function to add missing imports
function addMissingImport(filePath, importStatement) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Find the position after the last import statement
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }

    if (imports.length > 0) {
      // Find the last import line
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const endOfLastImport = content.indexOf(';', lastImportIndex) + 1;

      // Insert the new import after the last one
      const newContent =
        content.slice(0, endOfLastImport) +
        '\n' +
        importStatement +
        content.slice(endOfLastImport);

      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    } else {
      // No imports found, add at the beginning
      const newContent = importStatement + '\n' + content;
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
  } catch (error) {
    log(`❌ Error updating ${filePath}: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
function main() {
  log('🔧 Restoring essential CSS imports...', colors.cyan);

  let totalRestored = 0;
  let filesModified = 0;

  essentialCSSImports.forEach(({ file, imports }) => {
    const filePath = path.join(__dirname, '..', file);

    if (!fs.existsSync(filePath)) {
      log(`⚠️  File not found: ${filePath}`, colors.yellow);
      return;
    }

    imports.forEach((importStatement) => {
      if (!hasImport(filePath, importStatement)) {
        log(`📝 Adding to ${file}: ${importStatement}`, colors.blue);
        if (addMissingImport(filePath, importStatement)) {
          totalRestored++;
          filesModified++;
        }
      } else {
        log(`✅ Already exists in ${file}: ${importStatement}`, colors.green);
      }
    });
  });

  log('\n📊 Summary:', colors.cyan);
  log(`   Files checked: ${essentialCSSImports.length}`, colors.blue);
  log(`   Files modified: ${filesModified}`, colors.yellow);
  log(`   Imports restored: ${totalRestored}`, colors.green);

  if (totalRestored > 0) {
    log('\n🎉 Successfully restored essential CSS imports!', colors.green);
    log('💡 Your app styling should now be working correctly', colors.blue);
  } else {
    log('\n✨ All essential CSS imports are already present!', colors.green);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { addMissingImport, hasImport, essentialCSSImports };
