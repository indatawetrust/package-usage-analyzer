const glob = require("glob")
const babelParser = require("@babel/parser");
const fs = require("fs/promises")
const path = require("path")

const IMPORT_TYPE = {
  FILE: 1,
  PACKAGE: 2,
  DEV_PACKAGE: 3,
}

const packageUsageAnalyzer = ({ currentDir, rootDir, onStart, onAnalyze }) => {
  return new Promise((resolve, reject) => {
    glob(`${rootDir}/**/*.js`, {}, async (_err, tempFiles) => {
      const files = tempFiles

      let dependencies = {}, devDependencies = {};

      try {
        ({ dependencies, devDependencies } = require(path.join(currentDir, 'package.json'), 'utf-8'));
      } catch (error) {
        return reject(error);
      }

      onStart({ length: files.length });

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

          onAnalyze({ length: files.length });
        } catch (error) {
          onAnalyze({ error, length: files.length });
        }
      }

      return resolve({
        analyze,
        allPackages,
      });
    })
  })
}

module.exports = packageUsageAnalyzer;
