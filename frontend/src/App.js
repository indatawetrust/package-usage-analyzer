import { useState, useEffect, useCallback } from 'react';
import { Table, List } from 'antd';
import _ from 'lodash';

const IMPORT_TYPES = {
  FILE: 1,
  PACKAGE: 2,
  DEV_PACKAGE: 3,
};

const IMPORT_TYPE_TEXTS = {
  [IMPORT_TYPES.FILE]: 'file',
  [IMPORT_TYPES.PACKAGE]: 'package',
  [IMPORT_TYPES.DEV_PACKAGE]: 'dev package',
};

const columns = [
  {
    title: 'Name',
    dataIndex: 'packageName',
    key: 'name',
  },
  {
    title: 'Version',
    dataIndex: 'packageVersion',
    key: 'packageVersion',
  },
  {
    title: 'Import Type',
    dataIndex: 'importType',
    key: 'importType',
    render: importType => IMPORT_TYPE_TEXTS[importType],
  },
  {
    title: 'Usage Count',
    dataIndex: 'usageCount',
    key: 'usageCount',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.usageCount - b.usageCount,
  },
];

function App() {
  const [allPackages, setAllPackages] = useState([]);
  const [analyze, setAnalyze] = useState([]);

  const getUsages = useCallback(({ packageName }) => {
    const results = _.countBy(_.concat(..._.map(_.concat(..._.map(_.filter(analyze, u => _.filter(u.usages, { packageName }).length), u => _.filter(u.usages, { packageName }))), 'usagePackages')))

    return results
  }, [analyze]);

  const getUsageFiles = useCallback(({ usageName, packageName }) => {
    return _.map(
      analyze.filter(
        i => i.usages.filter(i => i.packageName === packageName && i.usagePackages.filter(j => j === usageName).length).length
      ),
      'file');
  }, [analyze]);

  useEffect(() => {
    fetch('/output.json')
      .then(res => res.json())
      .then(output => {
        setAllPackages(output.allPackages);
        setAnalyze(output.analyze);
      })
  }, []);

  return (
    <Table
      rowKey="packageName"
      dataSource={allPackages}
      columns={columns}
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
  );
}

export default App;
