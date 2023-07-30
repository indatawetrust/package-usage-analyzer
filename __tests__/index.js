const path = require("path");
const packageUsageAnalyzer = require("../lib");

describe("package usage analyzer tests", () => {
  test("successfull", async () => {
    const currentDir = process.cwd();
    const rootDir = path.join(currentDir, "__tests__/fixtures");

    const onStart = jest.fn();

    const onAnalyze = jest.fn();

    const result = await packageUsageAnalyzer({
      currentDir,
      rootDir,
      onStart,
      onAnalyze,
    });

    expect(onStart).toBeCalledTimes(1);

    expect(onAnalyze).toBeCalledTimes(4);

    const analyzeResult = result.analyze.map((item) => {
      item.file = item.file.replace(currentDir, "").slice(1);

      return item;
    });

    const allPackagesResult = [...result.allPackages];

    expect(analyzeResult).toEqual([
      {
        file: "__tests__/fixtures/foo/bar/baz.js",
        usages: [
          { packageName: "open", usagePackages: ["open"] },
          { packageName: "glob/sync", usagePackages: ["globSync"] },
          {
            packageName: "__tests__/fixtures/other-1",
            usagePackages: ["other1", "NUM"],
          },
        ],
      },
      {
        file: "__tests__/fixtures/index.js",
        usages: [
          { packageName: "express", usagePackages: ["a"] },
          { packageName: "open", usagePackages: ["b"] },
          { packageName: "release-it", usagePackages: ["releaseIt"] },
        ],
      },
      {
        file: "__tests__/fixtures/other-1.js",
        usages: [
          { packageName: "express", usagePackages: ["a"] },
          { packageName: "open", usagePackages: ["b"] },
        ],
      },
    ]);

    expect(allPackagesResult).toEqual([
      [
        "open",
        {
          packageName: "open",
          usageCount: 3,
          importType: 2,
          packageVersion: "^8.4.0",
          files: [
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/foo/bar/baz.js",
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/index.js",
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/other-1.js",
          ],
        },
      ],
      [
        "glob/sync",
        {
          packageName: "glob/sync",
          usageCount: 1,
          importType: 2,
          packageVersion: "^7.1.7",
          files: [
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/foo/bar/baz.js",
          ],
        },
      ],
      [
        "__tests__/fixtures/other-1",
        {
          packageName: "__tests__/fixtures/other-1",
          usageCount: 2,
          importType: 1,
          files: [
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/foo/bar/baz.js",
          ],
        },
      ],
      [
        "express",
        {
          packageName: "express",
          usageCount: 2,
          importType: 2,
          packageVersion: "^4.18.1",
          files: [
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/index.js",
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/other-1.js",
          ],
        },
      ],
      [
        "release-it",
        {
          packageName: "release-it",
          usageCount: 1,
          importType: 3,
          packageVersion: "^15.4.2",
          files: [
            "/Users/ahmet.simsek/projects/package-usage-analyzer/__tests__/fixtures/index.js",
          ],
        },
      ],
    ]);
  });

  test("wrong folder", async () => {
    const currentDir = process.cwd();
    const rootDir = path.join(currentDir, "__tests__/fixturesss");

    const onStart = jest.fn();

    const onAnalyze = jest.fn();

    const result = await packageUsageAnalyzer({
      currentDir,
      rootDir,
      onStart,
      onAnalyze,
    });

    expect(onStart).toBeCalledTimes(1);

    expect(onAnalyze).toBeCalledTimes(0);

    const analyzeResult = result.analyze;

    const allPackagesResult = [...result.allPackages];

    expect(analyzeResult).toEqual([]);

    expect(allPackagesResult).toEqual([]);
  });

  test("failure", async () => {
    const currentDir = "////nononono";
    const rootDir = "////nononono";

    const onStart = jest.fn();

    const onAnalyze = jest.fn();

    await expect(() =>
      packageUsageAnalyzer({
        currentDir,
        rootDir,
        onStart,
        onAnalyze,
      }),
    ).rejects.toThrowError();

    expect(onStart).toBeCalledTimes(0);

    expect(onAnalyze).toBeCalledTimes(0);
  });
});
