const
	fs = require('fs'),
	path = require('path'),
	handlebars = require('handlebars'),
	markdown = require('markdown-it')({ html: true, typographer: true });

// Markdown must not screw up handlebars tags in URLs.
markdown.normalizeLink = url => url;
markdown.validateLink = () => true;

const cache = {};

function load(name) {
	if(cache[name]) return cache[name];
	console.log(`LOAD_TPL ${name}`); // eslint-disable-line no-console
	return cache[name] = fs.readFileSync(path.join(
		__dirname, `../templates/${name}`
	)).toString('utf8');
}

function html(layout, content, loadContent) {
	if (loadContent) content = load(`${content}.md`);
	layout = handlebars.compile(load(`${layout}.hbs`));

	if (!content) return layout;
	return handlebars.compile(layout({ body: markdown.render(content) }));
}

function text(content, loadContent) {
	if (loadContent) content = load(`${content}.md`);
	return handlebars.compile(content);
}

module.exports = { html, text };
