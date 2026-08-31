const {transform} = require('@diplodoc/folding-headings-extension');

module.exports = function foldingHeadingsPlugin(md, opts) {
    md.use(transform(opts), opts);
};