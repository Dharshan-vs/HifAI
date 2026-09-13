const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Helper to check if a relative path should be ignored
function isIgnored(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const ignorePatterns = [
    /^\.git(\/|$)/,
    /^node_modules(\/|$)/,
    /^dist(\/|$)/,
    /^dist-ssr(\/|$)/,
    /^\.vercel(\/|$)/,
    /^\.vscode(\/|$)/,
    /^\.idea(\/|$)/,
    /^\.env(\.|$)/,
    /\.log$/,
  ];
  return ignorePatterns.some((pattern) => pattern.test(normalized));
}

// Recursively get all filepaths
function getAllFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (isIgnored(relPath)) continue;

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      files.push(relPath.replace(/\\/g, '/'));
    }
  }
  return files;
}

async function main() {
  console.log('📦 Working Directory:', ROOT_DIR);

  // 1. Init repo if not exists
  await git.init({ fs, dir: ROOT_DIR, defaultBranch: 'main' });
  console.log('✅ Git repository initialized.');

  // 2. Add remote origin
  try {
    await git.addRemote({
      fs,
      dir: ROOT_DIR,
      remote: 'origin',
      url: 'https://github.com/Dharshan-vs/HifAI.git',
      force: true,
    });
    console.log('✅ Remote origin set to https://github.com/Dharshan-vs/HifAI.git');
  } catch (err) {
    console.log('ℹ️ Remote notice:', err.message);
  }

  // 3. Stage files
  const files = getAllFiles(ROOT_DIR);
  console.log(`📁 Found ${files.length} project files to stage.`);

  for (const file of files) {
    await git.add({ fs, dir: ROOT_DIR, filepath: file });
  }
  console.log('✅ All project files staged.');

  // 4. Commit
  const sha = await git.commit({
    fs,
    dir: ROOT_DIR,
    author: {
      name: 'Dharshan-vs',
      email: 'dharshan@yuga.energy',
    },
    message: 'Initial commit: HifAI P2P Renewable Energy Trading Platform with PostgreSQL, Razorpay, and Blockchain Ledger',
  });
  console.log('✅ Commit created with SHA:', sha);

  // 5. Check if GitHub Token / Credentials passed in env or args
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  if (token) {
    console.log('🚀 Pushing to https://github.com/Dharshan-vs/HifAI.git ...');
    const pushResult = await git.push({
      fs,
      http,
      dir: ROOT_DIR,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({
        username: token,
      }),
    });
    console.log('🎉 Push successful!', JSON.stringify(pushResult));
  } else {
    console.log('\n💡 Local Git Repository is fully initialized and committed!');
    console.log('   To push to GitHub, run:');
    console.log('   node server/scripts/gitPush.cjs <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
  }
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
