const glob = require("glob")
const babelParser = require("@babel/parser");
const fs = require("fs/promises")
const path = require("path")

const IMPORT_TYPE = {
  FILE: 1,
  PACKAGE: 2,
  DEV_PACKAGE: 3,
}

const getPackageVersion = (dependencies, packageName) => {
  if (!dependencies) {
    return null
  }

  const pkgName = Object.keys(dependencies).find(pkg => packageName.includes(`${pkg}/`)) || packageName

  return dependencies[pkgName]
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
            const usageCount = usagePackages.length;

            if (packageName.match(/^[\.\\]/)) {
              packageName = path.relative(currentDir, path.join(path.dirname(file), packageName))
            }

            let packageVersion
            let importType = IMPORT_TYPE.FILE

            const dependencyVersion = getPackageVersion(dependencies, packageName)

            if (dependencyVersion) {
              importType = IMPORT_TYPE.PACKAGE

              packageVersion = dependencyVersion
            }

            const devDependencyVersion = getPackageVersion(devDependencies, packageName)

            if (devDependencyVersion) {
              importType = IMPORT_TYPE.DEV_PACKAGE

              packageVersion = devDependencyVersion
            }

            if (!allPackages.has(packageName)) {
              allPackages.set(packageName, {
                packageName,
                usageCount,
                importType,
                packageVersion,
                files: [file],
              })
            }
            else {
              const getPackage = allPackages.get(packageName)

              getPackage.usageCount += usageCount;
              getPackage.files.push(file);

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
