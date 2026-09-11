const {transform} = require('@diplodoc/quote-link-extension');

module.exports = function quoteLinkPlugin(md, opts) {
    md.use(transform({bundle: false, ...opts}));
};
