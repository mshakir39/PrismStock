# Unused Imports Remover

This script automatically detects and removes unused imports from all TypeScript/TSX files in the project.

## Usage

Run the script using npm:

```bash
npm run remove-unused-imports
```

## What it does

1. **Scans all TypeScript files** in the `src/` directory
2. **Analyzes import statements** and identifies which ones are actually used
3. **Removes unused imports** while preserving the file structure
4. **Provides detailed output** showing which files were modified and how many imports were removed
5. **Handles complex import patterns** including:
   - Default imports (`import React from 'react'`)
   - Named imports (`import { useState, useEffect } from 'react'`)
   - Namespace imports (`import * as React from 'react'`)
   - Multi-line imports
   - Aliased imports (`import { useState as useState } from 'react'`)

## Features

- ✅ **Safe detection**: Only removes imports that are truly unused
- ✅ **Multi-line support**: Handles imports spanning multiple lines
- ✅ **TypeScript aware**: Understands TypeScript syntax and patterns
- ✅ **Detailed reporting**: Shows exactly what was removed from each file
- ✅ **Non-destructive**: Won't break working code
- ✅ **Fast**: Processes hundreds of files in seconds

## Example Output

```
🔍 Scanning for unused imports...
📁 Found 159 TypeScript files
✅ src/components/sidebar.tsx: Removed 5 unused import(s)
✅ src/app/dashboard/page.tsx: Removed 2 unused import(s)

📊 Summary:
   Files processed: 159
   Files modified: 19
   Total imports removed: 24

🎉 Successfully cleaned up unused imports!
```

## Safety Features

- **Conservative approach**: Only removes imports when it's certain they're unused
- **Preserves comments**: Won't remove imports that are actually used in comments
- **Handles edge cases**: Deals with complex import patterns correctly
- **Backup friendly**: Shows exactly what was changed before making modifications

## Integration

The script is integrated into the project's package.json and can be run alongside other development tools:

```bash
npm run remove-unused-imports  # Clean up unused imports
npm run lint                 # Check for linting issues
npm run format               # Format the code
```

## Technical Details

The script uses:

- **AST-like parsing** to understand import structures
- **Regex-based detection** for identifying used identifiers
- **File system operations** to read and write files
- **Color-coded output** for better readability

## Notes

- The script is designed to be conservative - it's better to leave a potentially unused import than to break something
- Always run your linter and tests after running this script
- The script works with both `.ts` and `.tsx` files
- It ignores `node_modules` and other common directories
