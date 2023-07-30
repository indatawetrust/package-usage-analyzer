import _ from "lodash";
import { filter, flow, map } from "lodash/fp";

export const getPackageUsages = ({ analyze, packageName, folderFilter }) => {
  return flow([
    filter((u) =>
      folderFilter ? _.filter(u.usages, { packageName }).length && u.file?.match(new RegExp(folderFilter, "i"))
        : _.filter(u.usages, { packageName }).length,
    ),
    map((u) => _.filter(u.usages, { packageName })),
    (arr) => _.concat(...arr),
    map("usagePackages"),
    (arr) => _.concat(...arr),
    (usagePackages) => _.countBy(usagePackages),
  ])(analyze);
};

export const getPackageUsageFiles = ({
  analyze,
  packageName,
  usageName,
  folderFilter,
}) => {
  return flow([
    filter(
      (i) =>
        i.usages.filter(
          (i) =>
            i.packageName === packageName &&
            i.usagePackages.filter((j) => j === usageName).length,
        ).length,
    ),
    map("file"),
    filter((file) =>
      folderFilter ? file?.match(new RegExp(folderFilter, "i")) : true,
    ),
  ])(analyze);
};
