#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const glob = require("glob")
const babelParser = require("@babel/parser");
const fs = require("fs/promises")
const path = require("path")
const cliProgress = require('cli-progress')
const open = require('open')
const getPort = require('get-port')
const express = require('express')
const app = express()

const currentDir = process.cwd();
const rootDir = path.join(currentDir, argv.rootdir || 'src');
const packageDir = __dirname;

const bar1 = new cliProgress.SingleBar({
  format: '⌛ [{bar}] {percentage}% | {value}/{total}'
}, cliProgress.Presets.shades_classic);

const IMPORT_TYPE = {
  FILE: 1,
  PACKAGE: 2,
  DEV_PACKAGE: 3,
}

// options is optional
glob(`${rootDir}/**/*.js`, {}, async (err, files) => {
  let dependencies = {}, devDependencies = {};

  try {
    ({dependencies, devDependencies} = require(path.join(process.cwd(), 'package.json'), 'utf-8'))
  } catch (error) {
    console.log(error)
  }

  bar1.start(files.length, 0);

  const allPackages = new Map()

  let analyze = []

  for await (let file of files) {
    try {
      const code = await fs.readFile(file, 'utf8')

      const ast = babelParser.parse(code, {
        sourceType: "unambiguous",
        plugins: [
          "jsx",
        ],
      });

      const usages = []

      const importDeclarations = ast.program.body.filter(node => node.type === 'ImportDeclaration')

      for (let i of importDeclarations) {
        let packageName = i.source.value
        const usagePackages = i.specifiers.map(i => i.imported ? i.imported.name : i.local.name)

        if (packageName.match(/^[\.\\]/)) {
          packageName = path.relative(currentDir, path.join(path.dirname(file), packageName))
        }

        let packageVersion
        let importType = IMPORT_TYPE.FILE

        if (dependencies[packageName]) {
          importType = IMPORT_TYPE.PACKAGE

          packageVersion = dependencies[packageName]
        }

        if (devDependencies[packageName]) {
          importType = IMPORT_TYPE.DEV_PACKAGE

          packageVersion = devDependencies[packageName]
        }

        if (!allPackages.has(packageName)) {
          allPackages.set(packageName, {
            packageName,
            usageCount: 1,
            importType,
            packageVersion,
          })
        }
        else {
          const getPackage = allPackages.get(packageName)

          getPackage.usageCount++

          allPackages.set(packageName, getPackage)
        }

        usages.push({
          packageName,
          usagePackages,
        })
      }

      analyze.push({
        file,
        usages
      })

      bar1.increment()
    } catch (error) {
      bar1.setTotal(files.length - 1)
    }
  }

  fs.writeFile(packageDir + '/frontend/build/output.json', JSON.stringify({
    analyze,
    allPackages: [...allPackages.values()].sort((a, b) => b.usageCount - a.usageCount)
  }, null, 2))

  bar1.stop()

  app.use(express.static(packageDir + '/frontend/build'))

  const randomPort = await getPort()

  app.listen(randomPort, () => {
    const url = `http://localhost:${randomPort}`

    console.log(`\n🚀 ${url}`)

    open(url)
  })
})
