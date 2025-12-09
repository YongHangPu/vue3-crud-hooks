/**
 * 添加日期范围到查询参数中
 * @param params 查询参数对象
 * @param dateRange 日期范围数组 [开始日期, 结束日期]
 * @param fieldConfig 字段配置，可以是字符串或对象
 * @returns 包含日期范围的查询参数对象
 */
export const addDateRange = (
  params: any,
  dateRange: any[],
  fieldConfig?: string | { start: string; end: string }
) => {
  const search = params;
  search.params = typeof search.params === 'object' && search.params !== null && !Array.isArray(search.params) ? search.params : {};
  dateRange = Array.isArray(dateRange) ? dateRange : [];

  let startField: string;
  let endField: string;

  if (typeof fieldConfig === 'object' && fieldConfig !== null) {
    // 使用对象配置
    startField = fieldConfig.start;
    endField = fieldConfig.end;
  } else if (typeof fieldConfig === 'string') {
    // 保持向后兼容
    startField = 'begin' + fieldConfig;
    endField = 'end' + fieldConfig;
  } else {
    // 默认字段名
    startField = 'beginTime';
    endField = 'endTime';
  }

  search.params[startField] = dateRange[0];
  search.params[endField] = dateRange[1];

  return search;
};