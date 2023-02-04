#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const fs = require("fs/promises")
const cliProgress = require('cli-progress')
const open = require('open')
const getPort = require('get-port')
const express = require('express')
const path = require('path')
const app = express()
const packageUsageAnalyzer = require('../lib/index')

const currentDir = process.cwd();
const rootDir = path.join(currentDir, argv.rootdir || 'src');
const packageDir = __dirname;

const bar1 = new cliProgress.SingleBar({
  format: '⌛ [{bar}] {percentage}% | {value}/{total}'
}, cliProgress.Presets.shades_classic);

packageUsageAnalyzer({
  currentDir,
  rootDir,
  onStart: ({ length }) => {
    bar1.start(length, 0);
  },
  onAnalyze: ({ length, error }) => {
    if (error) {
      bar1.setTotal(length - 1)
    }
    else {
      bar1.increment()
    }
  }
}).then(async ({
  analyze,
  allPackages,
}) => {
  fs.writeFile(packageDir + '/../frontend/dist/output.json', JSON.stringify({
    analyze,
    allPackages: [...allPackages.values()].sort((a, b) => b.usageCount - a.usageCount)
  }, null, 2))

  bar1.stop()

  app.use(express.static(packageDir + '/../frontend/dist'))

  const randomPort = await getPort()

  app.listen(randomPort, () => {
    const url = `http://localhost:${randomPort}`

    console.log(`\n🚀 ${url}`)

    open(url)
  })
})
