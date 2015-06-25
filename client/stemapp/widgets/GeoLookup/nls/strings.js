define({
    root: {
        _widgetLabel: "GeoLookup",
        description: "Browse to or Drag a <a href='./widgets/geolookup/data/sample.csv' tooltip='Download an example sheet'> spreadsheet </a> here to visualize, and append map data to it.",
        selectCSV: "Select a CSV",
        loadingCSV: "Loading CSV",
        clearResults: "Clear Results",
        plotOnly: "Only Plot Points",
        plottingRows: "Ploting rows",
        error: {
            fetchingCSV: 'Error fetching items from CSV store: ${0}',
            fileIssue: 'File could not be processed.',
            notCSVFile: 'Only comma delimited files (.csv) files are supported at this time.',
            invalidCoord: 'Location fields are invalid. Please check the .csv.',
            tooManyRecords: 'Sorry, no more than ${0} records at this time.'
        },
        results: {
            csvLoaded: "${0} records from the CSV file have been loaded",
            recordsPlotted: "${0}/${1} records have been located on the map",
            recordsEnriched: "${0}/${1} processed, ${2} enriched against ${3}",
            recordsError: "${0} records had errors",
            recordsErrorList: "Row ${0} has an issue"
        }

    },
    "zh-cn": true
});
