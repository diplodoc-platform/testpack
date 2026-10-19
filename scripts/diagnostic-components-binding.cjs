const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const {execFileSync} = require('node:child_process');

const CLIENT_SHA = '02658f4fc4130acc230d80551b7faf0cccd938c8';

function verifyBindings(workspace, expectedSha) {
    if (!/^[a-f0-9]{40}$/.test(expectedSha || '')) throw new Error('Invalid source SHA');
    const root = fs.realpathSync(workspace);
    const selected = fs.realpathSync(path.join(root, 'packages/components'));
    const head = (directory) =>
        execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
    if (head(selected) !== expectedSha) throw new Error('Unexpected components source');
    if (head(path.join(root, 'packages/client')) !== CLIENT_SHA)
        throw new Error('Unexpected diagnostic client source');
    const consumers = ['packages/client', 'extensions/search'].map((consumer) => {
        const requireFrom = createRequire(path.join(root, consumer, 'package.json'));
        const entry = fs.realpathSync(requireFrom.resolve('@diplodoc/components'));
        if (!entry.startsWith(selected + path.sep))
            throw new Error(`Consumer ${consumer} is using a registry fallback: ${entry}`);
        return {consumer, entry: path.relative(root, entry)};
    });
    return {diagnosticOnly: true, clientSha: CLIENT_SHA, componentsSha: expectedSha, consumers};
}

if (require.main === module) {
    const [workspace, expectedSha, output] = process.argv.slice(2);
    const proof = verifyBindings(workspace, expectedSha);
    fs.mkdirSync(path.dirname(output), {recursive: true});
    fs.writeFileSync(output, JSON.stringify(proof, null, 2) + '\n');
    console.log(JSON.stringify(proof));
}

module.exports = {verifyBindings};
