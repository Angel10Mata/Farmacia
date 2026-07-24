const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// 1. Move getSwalThemeOpts to src/lib/utils.ts
const inventarioUtilsPath = path.join(srcDir, 'components', '(base)', 'inventario', 'lib', 'utils.ts');
const globalUtilsPath = path.join(srcDir, 'lib', 'utils.ts');
const newInventarioUtilsPath = path.join(srcDir, 'components', '(base)', 'inventario', 'utils.ts');

if (fs.existsSync(inventarioUtilsPath)) {
  const content = fs.readFileSync(inventarioUtilsPath, 'utf-8');
  
  // Extract getSwalThemeOpts
  const swalMatch = content.match(/export const getSwalThemeOpts[\s\S]*?};/);
  if (swalMatch) {
    let globalUtilsContent = fs.readFileSync(globalUtilsPath, 'utf-8');
    if (!globalUtilsContent.includes('getSwalThemeOpts')) {
      globalUtilsContent += '\n' + swalMatch[0] + '\n';
      fs.writeFileSync(globalUtilsPath, globalUtilsContent);
    }
  }

  // Extract exportarPDF and write to new location
  const pdfMatch = content.match(/export const exportarPDF[\s\S]*?};/);
  if (pdfMatch) {
    let newContent = `import jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";\nimport { fmtNum, fmtQ } from "@/lib/utils";\n\n`;
    newContent += pdfMatch[0] + '\n';
    fs.writeFileSync(newInventarioUtilsPath, newContent);
  }

  // Delete old utils.ts
  fs.unlinkSync(inventarioUtilsPath);
  console.log('Processed inventario/lib/utils.ts');
}

// 2. Move Ventas files
const ventasLibDir = path.join(srcDir, 'components', '(base)', 'ventas', 'lib');
const ventasDir = path.join(srcDir, 'components', '(base)', 'ventas');

const posContextOld = path.join(ventasLibDir, 'POSContext.tsx');
const posContextNew = path.join(ventasDir, 'POSContext.tsx');
if (fs.existsSync(posContextOld)) {
  fs.renameSync(posContextOld, posContextNew);
  console.log('Moved POSContext.tsx');
}

const typesOld = path.join(ventasLibDir, 'types.ts');
const typesNew = path.join(ventasDir, 'types.ts');
if (fs.existsSync(typesOld)) {
  fs.renameSync(typesOld, typesNew);
  console.log('Moved types.ts');
}

// Helper to update file contents
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

// 3. Update imports across the codebase
walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix getSwalThemeOpts imports
    if (content.includes('getSwalThemeOpts') && content.includes('/inventario/lib/utils')) {
      // Replace with global util
      content = content.replace(/import\s*\{[^}]*getSwalThemeOpts[^}]*\}\s*from\s*["'].*?\/inventario\/lib\/utils["'];?/g, 'import { getSwalThemeOpts } from "@/lib/utils";');
      modified = true;
    }

    // Fix exportarPDF
    if (content.includes('exportarPDF') && content.includes('/inventario/lib/utils')) {
      content = content.replace(/import\s*\{[^}]*exportarPDF[^}]*\}\s*from\s*["'].*?\/inventario\/lib\/utils["'];?/g, 'import { exportarPDF } from "@/components/(base)/inventario/utils";');
      modified = true;
    }
    
    // Fix POSContext
    if (content.includes('POSContext') && content.includes('/lib/POSContext')) {
      content = content.replace(/\/lib\/POSContext/g, '/POSContext');
      modified = true;
    }
    // Fix types
    if (content.includes('./lib/types')) {
      content = content.replace(/\.\/lib\/types/g, './types');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in ${filePath}`);
    }
  }
});

console.log('Refactor completed successfully!');
