'use strict';

const path = require('node:path');

const {inventoryCorpus} = require('./candidate-browser');

/**
 * Resolve the same frozen corpus that browsers serve, without silently skipping
 * comparator coverage or falling back from an invalid explicit candidate path.
 * @param {string} defaultDirectory Local development docs/output directory.
 * @param {Object} env Test runner environment.
 * @returns {string} Validated absolute corpus directory.
 */
function resolveRepositoryCorpus(defaultDirectory, env = process.env) {
    const explicit = Object.prototype.hasOwnProperty.call(env, 'CANDIDATE_CORPUS');
    const directory = explicit ? env.CANDIDATE_CORPUS : defaultDirectory;
    if (!directory || !path.isAbsolute(directory))
        throw new Error('Repository tests require an absolute CANDIDATE_CORPUS');
    try {
        inventoryCorpus(directory);
    } catch (error) {
        throw new Error(
            `Invalid repository corpus ${directory}: ${error.message}. ` +
                'Build local docs or set CANDIDATE_CORPUS to the frozen HTML output.',
        );
    }
    return path.resolve(directory);
}

module.exports = {resolveRepositoryCorpus};
