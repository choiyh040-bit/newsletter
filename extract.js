const fs = require('fs');
const path = require('path');

const files = [
  { file: 'landing.html', route: 'src/app/page.tsx', isRoot: true },
  { file: 'loading.html', route: 'src/app/loading/page.tsx' },
  { file: 'selection.html', route: 'src/app/selection/page.tsx' },
  { file: 'preview.html', route: 'src/app/preview/page.tsx' },
];

files.forEach(({ file, route, isRoot }) => {
  if (!fs.existsSync(file)) return;
  
  let html = fs.readFileSync(file, 'utf8');
  
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return;
  let bodyContent = bodyMatch[1];
  
  // Remove the tailwind scripts from body content since we put them in layout
  bodyContent = bodyContent.replace(/<script[^>]*tailwind-config[^>]*>[\s\S]*?<\/script>/i, '');
  bodyContent = bodyContent.replace(/<script[^>]*cdn\.tailwindcss\.com[^>]*>[\s\S]*?<\/script>/i, '');
  
  // Extract custom scripts to run them via useEffect
  let scripts = [];
  bodyContent = bodyContent.replace(/<script>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
    scripts.push(scriptContent);
    return '';
  });

  // Convert HTML to basic JSX
  // This is a naive conversion, it handles class -> className
  let jsxContent = bodyContent
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    // Escape { and } in text nodes to avoid JSX evaluation errors, except for style="" which we'll handle differently
    // Actually, inline styles are a problem in JSX: style="width: 100%" -> style={{width: '100%'}}
    // Let's do a naive replacement for simple styles found in the HTML
    .replace(/style="([^"]*)"/g, (match, styleString) => {
      const styleObj = {};
      styleString.split(';').forEach(rule => {
        if (!rule.trim()) return;
        const [key, value] = rule.split(':');
        if (key && value) {
          // camelCase key
          const camelKey = key.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styleObj[camelKey] = value.trim();
        }
      });
      return `style={${JSON.stringify(styleObj)}}`;
    })
    // Replace html comments <!-- ... --> with JSX comments {/* ... */}
    .replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

  // Handle self-closing tags: br, hr, img, input
  jsxContent = jsxContent.replace(/<(br|hr|img|input)([^>]*?)(?<!\/)>/g, '<$1$2 />');

  // Ensure directory exists
  const dir = path.dirname(route);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write the Next.js component
  const componentName = isRoot ? 'LandingPage' : path.basename(path.dirname(route)).charAt(0).toUpperCase() + path.basename(path.dirname(route)).slice(1) + 'Page';
  
  const tsxCode = `// @ts-nocheck
"use client";
import { useEffect } from 'react';
import Link from 'next/link';

export default function ${componentName}() {
  useEffect(() => {
    ${scripts.join('\n')}
  }, []);

  return (
    <>
      ${jsxContent}
    </>
  );
}
`;

  fs.writeFileSync(route, tsxCode);
  console.log('Generated', route);
});
