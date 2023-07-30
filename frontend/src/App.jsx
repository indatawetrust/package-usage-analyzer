import { useState, useEffect, useCallback } from "react";
import { Table, List, Input, Space } from "antd";
import _ from "lodash";
import { TABLE_COLUMNS } from "./constants";
import { getPackageUsages, getPackageUsageFiles } from "./utils";

const { Search } = Input;

function App() {
  const [allPackages, setAllPackages] = useState([]);
  const [analyze, setAnalyze] = useState([]);
  const [searchTerm, setSearchTerm] = useState(null);
  const [folderFilter, setFolderFilter] = useState(null);

  const getUsages = useCallback(
    ({ packageName }) => {
      const results = getPackageUsages({
        analyze,
        packageName,
        folderFilter,
      });

      return results;
    },
    [analyze, folderFilter],
  );

  const getUsageFiles = useCallback(
    ({ usageName, packageName }) => {
      return getPackageUsageFiles({
        analyze,
        packageName,
        usageName,
        folderFilter,
      });
    },
    [analyze, folderFilter],
  );

  const handleSearchTermChange = _.debounce((event) => {
    setSearchTerm(event.target.value);
  }, 200);

  const handleFolderFilterChange = _.debounce((event) => {
    setFolderFilter(event.target.value);
  }, 200);

  const getAllPackages = useCallback(() => {
    return allPackages
      .filter((pkg) =>
        folderFilter
          ? pkg.files.find((i) => i.match(new RegExp(folderFilter, "i")))
          : true,
      )
      .filter((pkg) =>
        searchTerm
          ? pkg.packageName?.toLowerCase?.().includes(searchTerm?.toLowerCase())
          : true,
      )
      .map((pkg) => {
        if (folderFilter) {
          pkg.numberOfFilesUsed = pkg.files.filter((i) =>
            i.match(new RegExp(folderFilter, "i")),
          )?.length;
          pkg.usageCount = analyze
            .filter((i) => i?.file.match(new RegExp(folderFilter, "i")))
            .map((i) =>
              i.usages
                .filter((p) => p.packageName === pkg.packageName)
                .map((p) => p.usagePackages),
            )
            .reduce((a, b) => [...a, ...b], [])
            .reduce((a, b) => [...a, ...b], [])?.length;
        }

        return pkg;
      });
  }, [allPackages, searchTerm, analyze, folderFilter]);

  useEffect(() => {
    fetch("/output.json")
      .then((res) => res.json())
      .then((output) => {
        const { analyze, allPackages } = output;

        setAllPackages(
          allPackages.map((item) => ({
            ...item,
            numberOfFilesUsed:
              analyze.filter((file) =>
                file.usages.find(
                  (usage) => usage.packageName === item.packageName,
                ),
              ).length || 0,
          })),
        );

        setAnalyze(analyze);
      });
  }, []);

  return (
    <Space
      direction="vertical"
      size="small"
      style={{ width: "calc(100% - 4rem)", margin: "2rem" }}
    >
      <Search
        placeholder="search package.."
        onInput={handleSearchTermChange}
        size="large"
        style={{ width: "100%" }}
      />
      <Search
        placeholder="folder filter.."
        onInput={handleFolderFilterChange}
        size="large"
        style={{ width: "100%" }}
      />
      <Table
        rowKey="packageName"
        dataSource={getAllPackages()}
        columns={TABLE_COLUMNS}
        expandable={{
          expandedRowRender: (packageItem) => (
            <Table
              dataSource={_.entries(
                getUsages({ packageName: packageItem.packageName }),
              )}
              rowKey="0"
              columns={[
                {
                  title: "Name",
                  dataIndex: "0",
                  key: "name",
                },
                {
                  title: "Usage Count",
                  dataIndex: "1",
                  key: "usageCount",
                  defaultSortOrder: "descend",
                  sorter: (a, b) => a[1] - b[1],
                },
              ]}
              expandable={{
                expandedRowRender: (record) => {
                  return (
                    <List
                      size="small"
                      bordered
                      dataSource={getUsageFiles({
                        usageName: record[0],
                        packageName: packageItem.packageName,
                      })}
                      renderItem={(item) => (
                        <List.Item>
                          <a
                            style={{ color: "#000" }}
                            href={`vscode://file${item}`}
                          >
                            {item}
                          </a>
                        </List.Item>
                      )}
                    />
                  );
                },
              }}
              pagination={false}
            />
          ),
        }}
      />
    </Space>
  );
}

export default App;
