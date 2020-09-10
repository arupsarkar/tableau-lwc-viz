import { LightningElement } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import tableauJSAPI from '@salesforce/resourceUrl/tableauJSAPI2';

import templateMain from './tableauViz2.html';

export default class TableauViz2 extends LightningElement {

    viz;
    isLibLoaded = false;
    workbook; 
    activeSheet;    
    activeTable;
    tableData;

    // function calls - start
    getUnderlyingData() {
        this.activeSheet = this.viz.getWorkbook().getActiveSheet()
        var options = {
            maxRows: 10, // Max rows to return. Use 0 to return all rows
            ignoreAliases: false,
            ignoreSelection: true,
            includeAllColumns: false
        };

        this.activeSheet.getUnderlyingDataAsync(options)
            .then(function(t) {
                this.activeTable = t
                this.tableData = JSON.stringify(table.getData())
            }) 
    }

    renderViz() {

        // Halt rendering if lib is not loaded
        if (!this.isLibLoaded) {
            return;
        }

        const containerDiv = this.template.querySelector(
            'div.tabVizPlaceholder2'
        );
        var url = "https://public.tableau.com/views/WorldIndicators/GDPpercapita";
        //var url = "https://public.tableau.com/profile/ellenn#!/vizhome/WorldIndicators/GDPpercapita"
        var options = {
          width: containerDiv.offsetWidth,
          height: 500,
          hideTabs: false,
          hideToolbar: false,
          onFirstInteractive: function () {
            this.workbook = this.viz.getWorkbook();
            this.activeSheet = this.workbook.getActiveSheet();
          }
        };
        this.viz = new tableau.Viz(containerDiv, url, options);    
        this.viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, (marksEvent) => {
            this.onMarksSelection(marksEvent)
            //get the underlying sheet data
            dataOptions = {
                maxRows: 10, // Max rows to return. Use 0 to return all rows
                ignoreAliases: false,
                ignoreSelection: true,
                includeAllColumns: false
            };            
            this.activeSheet.getUnderlyingDataAsync(dataOptions)
                .then(function(t) {
                    var table = t
                    this.tableData = jSON.stringify(table.getData())
                })
        })            
    }

    onMarksSelection(marksEvent) {
        return marksEvent.getMarksAsync()
            .then((marks) => {
                this.printSelection(marks)
            })
            
    }

    printSelection(marks) {
        var html = [];
        for (var markIndex = 0; markIndex < marks.length; markIndex++) {
          var pairs = marks[markIndex].getPairs();
          html.push("{Mark : [\"" + markIndex + "\"");
          for (var pairIndex = 0; pairIndex < pairs.length; pairIndex++) {
            var pair = pairs[pairIndex];
            html.push("{fieldName:\"" + pair.fieldName + "\"");
            html.push("formattedValue:\"" + pair.formattedValue + "\"}");
          }
          html.push("]}");
        }
      
        alert(html)
    }
    // function call -end
    async connectedCallback() {
        await loadScript(this, tableauJSAPI);
        this.isLibLoaded = true;
        this.renderViz();
    }

    renderedCallback() {
        this.renderViz();
    }

    render() {
        return templateMain;
    }    
}