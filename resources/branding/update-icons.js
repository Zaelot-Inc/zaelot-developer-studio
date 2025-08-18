#!/usr/bin/env node

/**
 * Script to update Zaelot branding icons throughout the application
 * This script copies and converts the official Zaelot SVG to all required formats
 */

const fs = require('fs');
const path = require('path');

const ZAELOT_ICON_SVG = path.join(__dirname, 'zaelot-app-icon.svg');
const ROOT_DIR = path.join(__dirname, '..', '..');

console.log('🎨 Updating Zaelot branding icons...');

// Files that need to be updated with Zaelot branding
const ICON_MAPPING = {
	// Application icons - these will need manual conversion from SVG
	'resources/darwin/code.icns': 'zaelot-app-icon.svg (needs conversion to .icns)',
	'resources/linux/code.png': 'zaelot-app-icon.svg (needs conversion to .png)',
	'resources/win32/code.ico': 'zaelot-app-icon.svg (needs conversion to .ico)',
	'resources/win32/code_150x150.png': 'zaelot-app-icon.svg (needs conversion to 150x150 .png)',
	'resources/win32/code_70x70.png': 'zaelot-app-icon.svg (needs conversion to 70x70 .png)',
	'resources/server/code-192.png': 'zaelot-app-icon.svg (needs conversion to 192x192 .png)',
	'resources/server/code-512.png': 'zaelot-app-icon.svg (needs conversion to 512x512 .png)',
};

// Configuration files that reference icons
const CONFIG_FILES = [
	'resources/win32/VisualElementsManifest.xml',
	'resources/server/manifest.json',
	'resources/linux/code.desktop',
	'resources/linux/code.appdata.xml'
];

console.log('📋 Icon files that need to be updated:');
Object.entries(ICON_MAPPING).forEach(([file, source]) => {
	console.log(`  ${file} ← ${source}`);
});

console.log('\n⚠️  Note: SVG to binary format conversion requires external tools:');
console.log('   • macOS: Use iconutil or Image2icon');
console.log('   • Linux: Use convert (ImageMagick)');
console.log('   • Windows: Use online converters or Inkscape');

console.log('\n📄 Configuration files to update:');
CONFIG_FILES.forEach(file => {
	console.log(`  ${file}`);
});

console.log('\n✅ Icon mapping complete. Manual conversion required.');
console.log('💡 For now, the SVG is ready at: resources/branding/zaelot-app-icon.svg');
