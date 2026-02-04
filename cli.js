#!/usr/bin/env node

import * as readline from 'readline';
import Kit from './kit.js';

const kit = new Kit(process.cwd());

const kitLogo =
    ` /\\_/\\
( o.o )
 > ^ <
`
const kitAscii =
    `▄▄▄   ▄▄▄          
███ ▄███▀ ▀▀  ██   
███████   ██ ▀██▀▀ 
███▀███▄  ██  ██   
███  ▀███ ██▄ ██  
`

function showHelp() {
    console.log(`
Commands:
  init              Initialize a new Kit repository
  add <files...>    Add files to the staging area (use "." for all)
  commit <message>  Create a new commit
  log               Show commit history
  status            Show the working tree status
  diff [file]       Show changes between commits or working tree
  help              Show this help message
  exit              Exit Kit
`);
}

function processCommand(input) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
        case 'init':
            kit.init();
            break;

        case 'add':
            if (args.length === 0) {
                console.log('Usage: add <files...>');
            } else {
                kit.add(args);
            }
            break;

        case 'commit':
            if (args.length === 0) {
                console.log('Usage: commit <message>');
            } else {
                kit.commit(args.join(' '));
            }
            break;

        case 'log':
            kit.log();
            break;

        case 'status':
            kit.status();
            break;

        case 'diff':
            kit.diff(args[0] || null);
            break;

        case 'help':
            showHelp();
            break;

        case 'exit':
        case 'quit':
            console.log('Goodbye!');
            process.exit(0);
            break;

        case '':
            // Empty input, do nothing
            break;

        default:
            console.log(`Unknown command: ${command}`);
            console.log('Type "help" for available commands');
    }
}

console.log(kitLogo);
console.log(kitAscii);
console.log('Kit - A lightweight version control system');
console.log('Type "help" for available commands, "exit" to quit\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt() {
    rl.question('\x1b[36mkit>\x1b[0m ', (answer) => {
        processCommand(answer);
        prompt();
    });
}

prompt();
