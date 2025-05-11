// Test script to verify PDF.js installation
const fs = require('fs');
const path = require('path');

// Check if pdfjs-dist is properly installed
try {
  const pdfjsPath = path.resolve(__dirname, 'node_modules', 'pdfjs-dist');
  if (fs.existsSync(pdfjsPath)) {
    console.log('✅ pdfjs-dist is installed at:', pdfjsPath);
    
    // Check specific version
    const packageJsonPath = path.join(pdfjsPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('✅ pdfjs-dist version:', packageJson.version);
    }
    
    // Check for worker file
    const workerPath = path.join(pdfjsPath, 'build', 'pdf.worker.js');
    if (fs.existsSync(workerPath)) {
      console.log('✅ PDF worker file exists at:', workerPath);
    } else {
      console.log('❌ PDF worker file not found at:', workerPath);
      
      // Check for alternative locations
      const altPaths = [
        path.join(pdfjsPath, 'legacy', 'build', 'pdf.worker.js'),
        path.join(pdfjsPath, 'lib', 'pdf.worker.js'),
        path.join(pdfjsPath, 'dist', 'pdf.worker.js')
      ];
      
      let found = false;
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log('✅ PDF worker file found at alternate location:', altPath);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log('❌ PDF worker file not found in any standard location');
      }
    }
  } else {
    console.log('❌ pdfjs-dist is not installed at:', pdfjsPath);
  }
  
  // Check for react-pdf nested pdfjs-dist
  const reactPdfPath = path.resolve(__dirname, 'node_modules', 'react-pdf');
  const nestedPdfjsPath = path.join(reactPdfPath, 'node_modules', 'pdfjs-dist');
  
  if (fs.existsSync(nestedPdfjsPath)) {
    console.log('❗ Nested pdfjs-dist found in react-pdf:', nestedPdfjsPath);
    const packageJsonPath = path.join(nestedPdfjsPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('⚠️ Nested pdfjs-dist version:', packageJson.version);
      if (packageJson.version !== '2.12.313') {
        console.log('⚠️ Version mismatch detected! This might cause issues.');
      }
    }
  } else {
    console.log('✅ No nested pdfjs-dist found in react-pdf');
  }
  
  console.log('\n✅ PDF test completed successfully');
} catch (error) {
  console.error('❌ Error testing PDF.js installation:', error);
} 