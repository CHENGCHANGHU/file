import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import packageData from './package.json' assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const [major, minor, patch] = packageData.version.split('.').map(Number);

const [ nodeExecutePath, fileExecutePath, ...commandArgs ] = process.argv;
const {
  values: argValues,
} = parseArgs({
  args: commandArgs,
  options: {
    'major': {
      type: 'boolean',
      short: 'j',
      default: false,
    },
    'minor': {
      type: 'boolean',
      short: 'n',
      default: false,
    },
    'patch': {
      type: 'boolean',
      short: 't',
      default: true,
    },
  },
});

let newVersionText = '';
if (argValues['major']) {
  newVersionText = `${major + 1}.0.0`;
} else if (argValues['minor']) {
  newVersionText = `${major}.${minor + 1}.0`;
} else if (argValues['patch']) {
  newVersionText = `${major}.${minor}.${patch + 1}`;
} else {
  throw new Error('缺少参数！');
}

const packageJSONPath = join(__dirname, '.', 'package.json');
writeFileSync(
  packageJSONPath,
  readFileSync(packageJSONPath, { encoding: 'utf-8' }).replace(packageData.version, newVersionText)
);

const tagText = 'v' + newVersionText;
spawnSync('git', ['add', '.'], { stdio: 'inherit' });
spawnSync('git', ['commit', '-m', tagText], { stdio: 'inherit' });
spawnSync('git', ['tag', '-a', tagText, '-m', `"${tagText}"`], { stdio: 'inherit' });
spawnSync('git', ['push', 'origin', 'main'], { stdio: 'inherit' });
spawnSync('npm', ['publish', '--access', 'public'], { stdio: 'inherit' });