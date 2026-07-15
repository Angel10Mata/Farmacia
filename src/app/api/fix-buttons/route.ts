import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
        callback(fullPath);
      }
    }
  });
}

function processClassName(classNameMatch: string, classNameStr: string) {
  let classes = classNameStr.split(/\s+/);
  
  let newClasses: string[] = [];
  let hasWFull = false;
  for (let cls of classes) {
    if (!cls) continue;
    if (cls === 'w-full') {
      newClasses.push('w-fit', 'max-w-full');
      hasWFull = true;
    } else if (
      cls.startsWith('hover:bg-') || 
      cls.startsWith('dark:hover:bg-') || 
      cls.startsWith('hover:opacity-') || 
      cls.startsWith('dark:hover:opacity-') || 
      cls.startsWith('hover:text-') || 
      cls.startsWith('dark:hover:text-') ||
      cls.startsWith('hover:border-') ||
      cls.startsWith('dark:hover:border-')
    ) {
      // Drop these
    } else {
      newClasses.push(cls);
    }
  }

  // Ensure cursor-pointer
  if (!newClasses.includes('cursor-pointer') && !newClasses.some(c => c.includes('cursor-not-allowed'))) {
    newClasses.push('cursor-pointer');
  }

  return classNameMatch.replace(classNameStr, newClasses.join(' '));
}

export async function GET() {
  const srcPath = path.join(process.cwd(), 'src', 'components');
  let modifiedFiles = 0;
  let modifiedPaths: string[] = [];

  try {
    walk(srcPath, (filePath) => {
      let content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content;

      const buttonRegex = /<button\b[^>]*>/gi;
      newContent = newContent.replace(buttonRegex, (match) => {
        let updatedMatch = match.replace(/className="([^"]*)"/g, (classMatch, classStr) => {
          return processClassName(classMatch, classStr);
        });

        if (updatedMatch.includes('className={')) {
           updatedMatch = updatedMatch.replace(/className=\{([^}]+)\}/g, (classMatch, inner) => {
              let newInner = inner.replace(/"([^"]*)"/g, (strMatch, str) => {
                 return '"' + processClassName('className="' + str + '"', str).replace(/className="(.*)"/, '$1') + '"';
              });
              newInner = newInner.replace(/`([^`]*)`/g, (strMatch, str) => {
                 return '`' + processClassName('className="' + str + '"', str).replace(/className="(.*)"/, '$1') + '`';
              });
              newInner = newInner.replace(/'([^']*)'/g, (strMatch, str) => {
                 return "'" + processClassName('className="' + str + '"', str).replace(/className="(.*)"/, '$1') + "'";
              });
              return 'className={' + newInner + '}';
           });
        }

        // Also add cursor-pointer if there's no className at all in the button tag
        if (!updatedMatch.includes('className=')) {
          updatedMatch = updatedMatch.replace('<button', '<button className="cursor-pointer"');
        }

        return updatedMatch;
      });

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        modifiedFiles++;
        modifiedPaths.push(filePath);
      }
    });

    return NextResponse.json({ success: true, count: modifiedFiles, paths: modifiedPaths });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
