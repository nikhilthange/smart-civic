const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptsDir = path.resolve(__dirname, 'scripts');
const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('test_') && f.endsWith('.js'));

console.log(`Found ${files.length} test scripts to execute.`);
const results = [];

for (const file of files) {
  process.stdout.write(`Testing ${file} ... `);
  const startTime = Date.now();
  try {
    const output = execSync(`node ${path.join('scripts', file)}`, {
      cwd: __dirname,
      timeout: 45000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PASS (${duration}s)`);
    results.push({ file, status: 'PASS', duration });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ FAIL (${duration}s)`);
    results.push({
      file,
      status: 'FAIL',
      duration,
      error: err.message,
      stdout: err.stdout?.slice(-1000),
      stderr: err.stderr?.slice(-1000)
    });
  }
}

console.log('\n======================================================');
console.log('SUMMARY OF ALL TEST SCRIPTS:');
console.log('======================================================');
const passed = results.filter(r => r.status === 'PASS');
const failed = results.filter(r => r.status === 'FAIL');
console.log(`Passed: ${passed.length} / ${results.length}`);
console.log(`Failed: ${failed.length} / ${results.length}`);

if (failed.length > 0) {
  console.log('\nFAILED TESTS DETAILS:');
  for (const f of failed) {
    console.log(`\n--- ${f.file} ---`);
    if (f.stderr) console.log('STDERR:\n' + f.stderr);
    if (f.stdout) console.log('STDOUT (tail):\n' + f.stdout);
  }
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED!');
  process.exit(0);
}
