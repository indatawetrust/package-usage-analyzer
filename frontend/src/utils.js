import _ from 'lodash';

export const getPackageUsages = ({ analyze, packageName }) => (
  _.countBy(
    _.concat(
      ..._.map(
        _.concat(
          ..._.map(
            _.filter(analyze, u => _.filter(u.usages, { packageName }).length), u => _.filter(u.usages, { packageName })
          )
        ),
        'usagePackages')
    )
  )
);

export const getPackageUsageFiles = ({ analyze, packageName, usageName }) => (
  _.map(
    analyze.filter(
      i => i.usages.filter(i => i.packageName === packageName && i.usagePackages.filter(j => j === usageName).length).length
    ),
    'file')
)
