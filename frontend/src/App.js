import { useState, useEffect, useCallback } from 'react';
import { Table, List, Input, Space } from 'antd';
import _ from 'lodash';
import { TABLE_COLUMNS } from './constants'
import { getPackageUsages, getPackageUsageFiles } from './utils'

const { Search } = Input;

function App() {
  const [allPackages, setAllPackages] = useState([]);
  const [analyze, setAnalyze] = useState([]);
  const [searchTerm, setSearchTerm] = useState(null);

  const getUsages = useCallback(({ packageName }) => {
    const results = getPackageUsages({
      analyze,
      packageName,
    });

    return results
  }, [analyze]);

  const getUsageFiles = useCallback(({ usageName, packageName }) => {
    return getPackageUsageFiles({
      analyze,
      packageName,
      usageName,
    });
  }, [analyze]);

  const handleSearchTermChange = (
    _.debounce(event => {
      setSearchTerm(event.target.value)
    }, 200)
  );

  const getAllPackages = useCallback(() => {
    if (searchTerm?.length) {
      return allPackages.filter(pkg => (
        pkg.packageName?.toLowerCase?.().includes(searchTerm?.toLowerCase())
      ));
    }

    return allPackages;
  }, [allPackages, searchTerm]);

  useEffect(() => {
    fetch('/output.json')
      .then(res => res.json())
      .then(output => {
        setAllPackages(output.allPackages);
        setAnalyze(output.analyze);
      })
  }, []);

  return (
    <Space direction="vertical" size="small" style={{ width: 'calc(100% - 4rem)', margin: '2rem' }}>
      <Search
        placeholder="search package.."
        onInput={handleSearchTermChange}
        size="large"
        style={{ width: '100%' }}
      />
      <Table
        rowKey="packageName"
        dataSource={getAllPackages()}
        columns={TABLE_COLUMNS}
        expandable={{
          expandedRowRender: packageItem => (
            <Table
              dataSource={_.entries(getUsages({ packageName: packageItem.packageName }))}
              rowKey="0"
              columns={[
                {
                  title: 'Name',
                  dataIndex: '0',
                  key: 'name',
                },
                {
                  title: 'Usage Count',
                  dataIndex: '1',
                  key: 'usageCount',
                  defaultSortOrder: 'descend',
                  sorter: (a, b) => a[1] - b[1],
                },
              ]}
              expandable={{
                expandedRowRender: record => {
                  return (
                    <List
                      size="small"
                      bordered
                      dataSource={getUsageFiles({
                        usageName: record[0],
                        packageName: packageItem.packageName,
                      })}
                      renderItem={item => <List.Item>{item}</List.Item>}
                    />
                  )
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
