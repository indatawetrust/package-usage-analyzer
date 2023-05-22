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

export const TABLE_COLUMNS = [
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
    filters: [
      {
        text: 'file',
        value: IMPORT_TYPES.FILE,
      },
      {
        text: 'package',
        value: IMPORT_TYPES.PACKAGE,
      },
      {
        text: 'dev package',
        value: IMPORT_TYPES.DEV_PACKAGE,
      },
    ],
    onFilter: (value, record) => record.importType === value,
    filterSearch: false,
    render: importType => IMPORT_TYPE_TEXTS[importType],
  },
  {
    title: 'Usage Count',
    dataIndex: 'usageCount',
    key: 'usageCount',
    defaultSortOrder: 'descend',
    sorter: (a, b) => a.usageCount - b.usageCount,
  },
  {
    title: 'Number of Files Used',
    dataIndex: 'numberOfFilesUsed',
    key: 'numberOfFilesUsed',
  }
];
