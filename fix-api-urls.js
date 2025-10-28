#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// กำหนดโฟลเดอร์ที่ต้องการค้นหา
const searchDirs = ['frontend/app', 'frontend/lib', 'frontend/components', 'frontend/hooks'];
const baseDir = __dirname;

// รายการ URLs ที่ต้องแทนที่
const replacements = [
  {
    old: 'http://localhost:3001',
    new: 'http://localhost:5680'
  },
  {
    old: 'http://localhost:3003',
    new: 'http://localhost:5680'
  },
  {
    old: 'localhost:3001',
    new: 'localhost:5680'
  },
  {
    old: 'localhost:3003', 
    new: 'localhost:5680'
  }
];

// ส่วนขยายไฟล์ที่ต้องตรวจสอบ
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory does not exist: ${dirPath}`);
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // ข้าม node_modules และ .next
      if (!file.includes('node_modules') && !file.includes('.next')) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // ตรวจสอบส่วนขยายไฟล์
      const ext = path.extname(file);
      if (fileExtensions.includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    replacements.forEach(({ old, new: newVal }) => {
      if (content.includes(old)) {
        content = content.replace(new RegExp(old, 'g'), newVal);
        hasChanges = true;
        console.log(`✅ Updated: ${filePath} - ${old} -> ${newVal}`);
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting API URL replacement...');
  console.log('📂 Searching directories:', searchDirs);
  
  let totalFiles = 0;
  let modifiedFiles = 0;

  searchDirs.forEach(dir => {
    const fullDirPath = path.join(baseDir, dir);
    console.log(`\n📁 Processing: ${fullDirPath}`);
    
    const files = getAllFiles(fullDirPath);
    totalFiles += files.length;
    
    files.forEach(file => {
      if (replaceInFile(file, replacements)) {
        modifiedFiles++;
      }
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files checked: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log('✅ API URL replacement completed!');
}

main();