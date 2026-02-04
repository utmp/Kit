import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';

class Kit {
    constructor(repoPath = '.') {
        this.repoPath = resolve(repoPath);
        this.initialized = false;

        this.objects = {};      
        this.index = {};        
        this.commits = [];     
        this.head = null;      
    }


    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return timestamp + random;
    }

    init() {
        if (this.initialized) {
            console.log(`Repository already initialized at ${this.repoPath}`);
            return false;
        }

        this.initialized = true;
        this.objects = {};
        this.index = {};
        this.commits = [];
        this.head = null;

        console.log(`Initialized empty Kit repository in ${this.repoPath}`);
        return true;
    }


    isInitialized() {
        return this.initialized;
    }


    storeObject(content) {
        const id = this.generateId();
        this.objects[id] = content;
        return id;
    }


    getObject(id) {
        return this.objects[id] || null;
    }


    getWorkingFiles(dir = this.repoPath, files = []) {
        const entries = readdirSync(dir);

        for (const entry of entries) {
            if (entry === 'node_modules' || entry === '.git') continue;

            const fullPath = join(dir, entry);
            const relativePath = relative(this.repoPath, fullPath);

            if (statSync(fullPath).isDirectory()) {
                this.getWorkingFiles(fullPath, files);
            } else {
                files.push(relativePath);
            }
        }

        return files;
    }

    add(files) {
        if (!this.isInitialized()) {
            console.log('Not a Kit repository. Run "kit init" first.');
            return false;
        }

        let addedCount = 0;

        for (let file of files) {
            // Handle "." to add all files
            if (file === '.') {
                const allFiles = this.getWorkingFiles();
                for (const f of allFiles) {
                    if (this.addSingleFile(f)) {
                        addedCount++;
                    }
                }
            } else {
                if (this.addSingleFile(file)) {
                    addedCount++;
                }
            }
        }

        console.log(`Added ${addedCount} file(s) to staging area`);
        return true;
    }

    addSingleFile(filePath) {
        const fullPath = join(this.repoPath, filePath);

        if (!existsSync(fullPath)) {
            console.log(`File not found: ${filePath}`);
            return false;
        }

        const content = readFileSync(fullPath, 'utf-8');
        const objectId = this.storeObject(content);

        this.index[filePath] = objectId;
        return true;
    }

    commit(message) {
        if (!this.isInitialized()) {
            console.log('Not a Kit repository. Run "kit init" first.');
            return null;
        }

        if (Object.keys(this.index).length === 0) {
            console.log('Nothing to commit (staging area is empty)');
            return null;
        }

        const commit = {
            id: this.generateId(),
            tree: { ...this.index },
            parent: this.head,
            message: message,
            timestamp: new Date().toISOString(),
            author: 'Kit User'
        };

        this.commits.push(commit);
        this.head = commit.id;

        this.index = {};

        console.log(`[${commit.id.slice(0, 7)}] ${message}`);
        console.log(` ${Object.keys(commit.tree).length} file(s) committed`);

        return commit.id;
    }

    log() {
        if (!this.isInitialized()) {
            console.log('Not a Kit repository. Run "kit init" first.');
            return;
        }

        if (this.commits.length === 0) {
            console.log('No commits yet');
            return;
        }

        console.log('');

        for (let i = this.commits.length - 1; i >= 0; i--) {
            const commit = this.commits[i];

            console.log(`\x1b[33mcommit ${commit.id}\x1b[0m`);
            console.log(`Date:   ${commit.timestamp}`);
            console.log(`Author: ${commit.author}`);
            console.log('');
            console.log(`    ${commit.message}`);
            console.log('');
        }
    }


    status() {
        if (!this.isInitialized()) {
            console.log('Not a Kit repository. Run "kit init" first.');
            return;
        }

        let lastTree = {};
        if (this.commits.length > 0) {
            const lastCommit = this.commits[this.commits.length - 1];
            lastTree = lastCommit.tree || {};
        }

        const workingFiles = this.getWorkingFiles();

        const staged = Object.keys(this.index);
        const untracked = [];

        for (const file of workingFiles) {
            if (!this.index[file] && !lastTree[file]) {
                untracked.push(file);
            }
        }

        console.log('On branch main\n');

        if (staged.length > 0) {
            console.log('Changes to be committed:');
            console.log('  (use "kit status" to see staged files)\n');
            for (const file of staged) {
                console.log(`\x1b[32m\tnew file:   ${file}\x1b[0m`);
            }
            console.log('');
        }

        if (untracked.length > 0) {
            console.log('Untracked files:');
            console.log('  (use "kit add <file>..." to include in what will be committed)\n');
            for (const file of untracked) {
                console.log(`\x1b[31m\t${file}\x1b[0m`);
            }
            console.log('');
        }

        if (staged.length === 0 && untracked.length === 0) {
            console.log('nothing to commit, working tree clean');
        }
    }


    diff(filePath = null) {
        if (!this.isInitialized()) {
            console.log('Not a Kit repository. Run "kit init" first.');
            return;
        }

        if (this.commits.length === 0) {
            console.log('No commits yet');
            return;
        }

        if (this.commits.length === 1) {
            const commit = this.commits[0];
            const tree = commit.tree || {};

            console.log(`\x1b[33mChanges in commit: ${commit.message}\x1b[0m\n`);

            for (const [file, objectId] of Object.entries(tree)) {
                if (filePath && file !== filePath) continue;

                const content = this.getObject(objectId) || '';
                console.log(`\x1b[32m+++ New file: ${file}\x1b[0m`);
                console.log(content.split('\n').map(l => `\x1b[32m+ ${l}\x1b[0m`).join('\n'));
                console.log('');
            }
            return;
        }

        const previousCommit = this.commits[this.commits.length - 2];
        const lastCommit = this.commits[this.commits.length - 1];

        const previousTree = previousCommit.tree || {};
        const lastTree = lastCommit.tree || {};

        console.log(`\x1b[33mChanges from "${previousCommit.message}" to "${lastCommit.message}"\x1b[0m\n`);

        const allFiles = new Set([...Object.keys(previousTree), ...Object.keys(lastTree)]);

        for (const file of allFiles) {
            if (filePath && file !== filePath) continue;

            const previousObjectId = previousTree[file];
            const lastObjectId = lastTree[file];

            const previousContent = previousObjectId ? (this.getObject(previousObjectId) || '') : '';
            const lastContent = lastObjectId ? (this.getObject(lastObjectId) || '') : '';

            if (previousContent === lastContent) {
                continue; // No changes
            }

            if (!previousObjectId) {
                console.log(`\x1b[32m+++ New file: ${file}\x1b[0m`);
                console.log(lastContent.split('\n').map(l => `\x1b[32m+ ${l}\x1b[0m`).join('\n'));
                console.log('');
                continue;
            }

            if (!lastObjectId) {
                console.log(`\x1b[31m--- Deleted file: ${file}\x1b[0m`);
                console.log(previousContent.split('\n').map(l => `\x1b[31m- ${l}\x1b[0m`).join('\n'));
                console.log('');
                continue;
            }

            console.log(`\x1b[1mdiff --kit a/${file} b/${file}\x1b[0m`);
            console.log(`--- a/${file}`);
            console.log(`+++ b/${file}`);

            const oldLines = previousContent.split('\n');
            const newLines = lastContent.split('\n');

            const maxLen = Math.max(oldLines.length, newLines.length);

            for (let i = 0; i < maxLen; i++) {
                const oldLine = oldLines[i];
                const newLine = newLines[i];

                if (oldLine === undefined) {
                    console.log(`\x1b[32m+ ${newLine}\x1b[0m`);
                } else if (newLine === undefined) {
                    console.log(`\x1b[31m- ${oldLine}\x1b[0m`);
                } else if (oldLine !== newLine) {
                    console.log(`\x1b[31m- ${oldLine}\x1b[0m`);
                    console.log(`\x1b[32m+ ${newLine}\x1b[0m`);
                }
            }
            console.log('');
        }
    }
}

export default Kit;