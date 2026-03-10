"use strict";
/**
 * Build-time utilities for rspress-terminology plugin
 * This module ONLY runs server-side during the build process
 * NOT included in client bundles
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMarkdown = parseMarkdown;
exports.processHoverText = processHoverText;
exports.normalizePath = normalizePath;
exports.ensureDirectory = ensureDirectory;
exports.writeJsonFile = writeJsonFile;
exports.getMarkdownFiles = getMarkdownFiles;
exports.buildTermIndex = buildTermIndex;
exports.generateGlossaryJson = generateGlossaryJson;
exports.injectGlossaryComponent = injectGlossaryComponent;
exports.copyTermJsonFiles = copyTermJsonFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const remark_1 = require("remark");
const remark_html_1 = __importDefault(require("remark-html"));
function parseMarkdown(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    if (!match) {
        return { metadata: {}, content };
    }
    const frontmatter = match[1];
    const body = match[2];
    const metadata = {};
    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            metadata[key] = value;
        }
    });
    return {
        metadata,
        content: body.trim()
    };
}
async function processHoverText(hoverText) {
    if (!hoverText)
        return '';
    try {
        const result = await (0, remark_1.remark)()
            .use(remark_html_1.default, { sanitize: true })
            .process(hoverText);
        return String(result);
    }
    catch (error) {
        console.warn('Failed to process hoverText:', error);
        return hoverText;
    }
}
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}
function ensureDirectory(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
function writeJsonFile(filePath, data) {
    ensureDirectory(path_1.default.dirname(filePath));
    fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
function getMarkdownFiles(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        return [];
    }
    return fs_1.default.readdirSync(dirPath)
        .filter(file => /\.(md|mdx)$/.test(file))
        .map(file => path_1.default.join(dirPath, file));
}
async function buildTermIndex(options) {
    const termIndex = new Map();
    const termsPath = path_1.default.resolve(process.cwd(), options.termsDir);
    const docsDir = path_1.default.resolve(process.cwd(), options.docsDir);
    const basePath = options.basePath || '';
    console.log(`[rspress-terminology] Scanning terms in: ${termsPath}`);
    console.log(`[rspress-terminology] Docs directory: ${docsDir}`);
    console.log(`[rspress-terminology] Base path: ${basePath || '(none)'}`);
    if (!fs_1.default.existsSync(termsPath)) {
        console.warn(`[rspress-terminology] Terms directory not found: ${termsPath}`);
        return termIndex;
    }
    const termFiles = getMarkdownFiles(termsPath);
    for (const filePath of termFiles) {
        try {
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            const { metadata, content: body } = parseMarkdown(content);
            if (!metadata.id || !metadata.title) {
                console.warn(`[rspress-terminology] Skipping ${path_1.default.basename(filePath)}: missing id or title`);
                continue;
            }
            const hoverTextHtml = await processHoverText(metadata.hoverText || '');
            const relativeToDocs = path_1.default.relative(docsDir, filePath);
            const termPath = normalizePath(relativeToDocs).replace(/\.(md|mdx)$/, '');
            const fullTermPath = `${basePath}/${termPath}`;
            const termMetadata = {
                id: metadata.id,
                title: metadata.title,
                hoverText: hoverTextHtml,
                content: body,
                filePath: relativeToDocs,
                routePath: fullTermPath
            };
            termIndex.set(fullTermPath, termMetadata);
            console.log(`[rspress-terminology] Indexed term: ${metadata.id} -> ${fullTermPath}`);
        }
        catch (error) {
            console.error(`[rspress-terminology] Error processing ${filePath}:`, error);
        }
    }
    console.log(`[rspress-terminology] Indexed ${termIndex.size} terms`);
    return termIndex;
}
function generateGlossaryJson(termIndex, docsDir) {
    const glossaryPath = path_1.default.join(process.cwd(), docsDir, 'glossary.json');
    const glossaryData = Object.fromEntries(termIndex);
    writeJsonFile(glossaryPath, glossaryData);
    console.log(`[rspress-terminology] Generated glossary.json: ${glossaryPath}`);
}
function injectGlossaryComponent(glossaryFilepath, hasCustomComponent) {
    const fullPath = path_1.default.resolve(process.cwd(), glossaryFilepath);
    if (!fs_1.default.existsSync(fullPath)) {
        console.warn(`[rspress-terminology] Glossary file not found: ${fullPath}`);
        return;
    }
    if (hasCustomComponent) {
        console.log('[rspress-terminology] Using custom glossary component');
        return;
    }
    const content = fs_1.default.readFileSync(fullPath, 'utf-8');
    const glossaryComponentMarker = '<Glossary />';
    if (!content.includes(glossaryComponentMarker)) {
        const updatedContent = content.trimEnd() + '\n\n' + glossaryComponentMarker + '\n';
        fs_1.default.writeFileSync(fullPath, updatedContent, 'utf-8');
        console.log(`[rspress-terminology] Injected Glossary component into: ${fullPath}`);
    }
}
function copyTermJsonFiles(termIndex) {
    const tempDir = path_1.default.join(process.cwd(), '.rspress', 'terminology');
    for (const [termPath, metadata] of termIndex.entries()) {
        const jsonPath = path_1.default.join(tempDir, `${termPath.replace(/^\//, '')}.json`);
        const jsonDir = path_1.default.dirname(jsonPath);
        ensureDirectory(jsonDir);
        writeJsonFile(jsonPath, metadata);
    }
    console.log(`[rspress-terminology] Generated ${termIndex.size} term JSON files in: ${tempDir}`);
}
