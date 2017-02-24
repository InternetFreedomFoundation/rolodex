const
	handlebars = require('handlebars'),
	markdown = require('markdown-it')({ html: true, typographer: true });

// Markdown must not screw up handlebars tags in URLs.
markdown.normalizeLink = url => url;
markdown.validateLink = () => true;

function html(layout, content) {
	return handlebars.compile(
		layout.replace('{{{body}}}', markdown.render(content))
	);
}

function text(content) {
	return handlebars.compile(content);
}

module.exports = { html, text };
