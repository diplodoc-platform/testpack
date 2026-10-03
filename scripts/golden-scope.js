#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const {execFileSync} = require('node:child_process');

/**
 * Classify dependency-only scope without installing or importing candidate code.
 * @param {string} baseSha Immutable base revision.
 * @param {string} headSha Immutable candidate revision.
 * @param {Function} git Synchronous Git runner.
 * @returns {Object} Dependency scope and comparison decision.
 */
function classifyScope(baseSha, headSha, git = execFileSync) {
    if (![baseSha, headSha].every((sha) => /^[a-f0-9]{40}$/i.test(sha || '')))
        throw new Error('Invalid comparison SHA');
    const sections = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
        'overrides',
    ];
    const manifest = (sha) =>
        JSON.parse(git('git', ['show', `${sha}:package.json`], {encoding: 'utf8'}));
    const dependencies = (value) =>
        Object.fromEntries(sections.map((section) => [section, value[section] || {}]));
    const manifestChanged =
        JSON.stringify(dependencies(manifest(baseSha))) !==
        JSON.stringify(dependencies(manifest(headSha)));
    let lockChanged = false;
    try {
        git('git', ['diff', '--quiet', baseSha, headSha, '--', 'package-lock.json']);
    } catch (error) {
        if (error.status !== 1) throw error;
        lockChanged = true;
    }
    const otherFiles = git(
        'git',
        [
            'diff',
            '--name-only',
            baseSha,
            headSha,
            '--',
            ':(exclude)package.json',
            ':(exclude)package-lock.json',
        ],
        {encoding: 'utf8'},
    ).trim();
    const dependencyOnly = otherFiles.length === 0;
    const hasDependencyChanges = manifestChanged || lockChanged;
    return {
        dependencyOnly,
        hasDependencyChanges,
        runComparison: dependencyOnly && hasDependencyChanges,
    };
}

function main(env = process.env) {
    const decision = classifyScope(env.BASE_SHA, env.HEAD_SHA);
    fs.appendFileSync(
        env.GITHUB_OUTPUT,
        `dependency-only=${decision.dependencyOnly}\nhas-dependency-changes=${decision.hasDependencyChanges}\nrun-comparison=${decision.runComparison}\n`,
    );
}

if (require.main === module) main();
module.exports = {classifyScope};
