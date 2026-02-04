# Kit

A lightweight version control system implemented in JavaScript.

## Installation

```bash
# Install dependencies
bun install

# Link globally (optional, for using 'kit' command anywhere)
bun link
```

## Usage

### Initialize a Repository

```bash
kit init
```

Creates a new Kit repository in the current directory by setting up the `.kit` folder structure.

### Add Files

```bash
# Add specific files
kit add file1.js file2.js

# Add all files
kit add .
```

Stages files for the next commit.

### Commit Changes

```bash
kit commit -m "Your commit message"
```

Creates a new commit with all staged changes.

### View History

```bash
kit log
```

Shows the commit history with hashes, dates, and messages.

### Check Status

```bash
kit status
```

Displays:
- Staged files (ready to commit)
- Modified files (changed but not staged)
- Untracked files (new files not added)

### View Differences

```bash
# Show all changes
kit diff

# Show changes for a specific file
kit diff filename.js
```

Shows line-by-line differences between working files and the last commit.

## How It Works

Kit stores repository data in a `.kit` directory:

```
.kit/
├── HEAD              # Points to the current branch
├── index             # Staging area (JSON)
├── objects/          # Content-addressed file storage
│   └── {sha1-hash}   # Stored file contents and commits
└── refs/
    └── heads/
        └── main      # Branch reference
```

### Commits

Each commit contains:
- **tree**: Snapshot of all files and their hashes
- **parent**: Reference to the previous commit
- **message**: Commit message
- **timestamp**: When the commit was created
- **author**: Who made the commit

## Examples

### Basic Workflow

```bash
# Initialize a new repository
kit init

# Create a file
echo "Hello, World!" > hello.txt

# Stage the file
kit add hello.txt

# Commit
kit commit -m "Initial commit"

# Make changes
echo "Goodbye, World!" >> hello.txt

# Check status
kit status

# View differences
kit diff hello.txt

# Stage and commit changes
kit add hello.txt
kit commit -m "Add farewell message"

# View history
kit log
```

## Development

```bash
# Run the development file
bun run dev

# Run CLI directly
bun run cli.js
```

## License

MIT
