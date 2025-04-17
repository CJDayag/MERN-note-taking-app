const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({
    html: false,        // Disable HTML tags in source
    xhtmlOut: true,     // Use '/' to close single tags (<br />)
    breaks: true,       // Convert '\n' in paragraphs into <br>
    linkify: true,      // Autoconvert URL-like text to links
    typographer: true,  // Enable some language-neutral replacement + quotes beautification
});

/**
 * Converts markdown text to HTML
 * @param {string} text Markdown text
 * @returns {string} HTML string
 */
function renderMarkdown(text) {
    if (!text) return '';
    return md.render(text);
}

/**
 * Renders a plain text preview from markdown content
 * @param {string} markdownText The markdown text
 * @param {number} length Maximum length of the preview
 * @returns {string} Plain text preview
 */
function getPlainTextPreview(markdownText, length = 100) {
    if (!markdownText) return '';
    
    // Remove markdown formatting
    let plainText = markdownText
        .replace(/#+\s/g, '') // Remove headers
        .replace(/\*\*/g, '')  // Remove bold
        .replace(/\*/g, '')    // Remove italic
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with link text
        .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
        .replace(/`([^`]+)`/g, '$1')   // Remove inline code
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/>\s/g, '')  // Remove blockquotes
        .replace(/-\s/g, '')  // Remove list markers
        .replace(/\n/g, ' ')  // Replace newlines with spaces
        .trim();
    
    // Truncate if necessary
    if (plainText.length > length) {
        plainText = plainText.substring(0, length) + '...';
    }
    
    return plainText;
}

module.exports = {
    renderMarkdown,
    getPlainTextPreview
};
