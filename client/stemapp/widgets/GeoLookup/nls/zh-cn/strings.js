define({
    root: {
        _widgetLabel: "地理查询",
        description: "浏览或拖动 <a href='./widgets/geolookup/data/sample.csv' tooltip='Download an example sheet'> 电子表格 </a> 这里可视化，并追加地图数据给它",
        selectCSV: "选择一个CSV",
        loadingCSV: "加载CSV",
        clearResults: "清除结果",
        plotOnly: "只有剧情点",
        plottingRows: "行作图",
        error: {
            fetchingCSV: '从CSV存储错误获取项目: ${0}',
            fileIssue: '文件无法处理.',
            notCSVFile: '只有逗号分隔文件（ .CSV ）文件，在这个时候支持',
            invalidCoord: '位置字段是无效的。请检查.csv格式.',
            tooManyRecords: '对不起，不超过 ${0} 此时记录.'
        },
        results: {
            csvLoaded: "${0} 从CSV文件中的记录已经被加载",
            recordsPlotted: "${0}/${1} 记录已经被定位在地图上",
            recordsEnriched: "${0}/${1} 处理, ${2} 对丰富 ${3}",
            recordsError: "${0} 记录有错误",
            recordsErrorList: "排 ${0} 有一个问题"
        }

    }
});