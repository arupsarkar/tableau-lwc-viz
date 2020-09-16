import { LightningElement, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import tableauJSAPI from '@salesforce/resourceUrl/tableauJSAPI';
import { createRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import TABLEAU_LOG_OBJECT from '@salesforce/schema/Tableau_Log__c';
import DATA_VALUE_FIELD from '@salesforce/schema/Tableau_Log__c.Data_Value__c';

import templateMain from './tableauViz2.html';

export default class TableauViz2 extends LightningElement {

    viz;
    isLibLoaded = false;
    workbook; 
    activeSheet;
    activeFilterSheet;    
    activeTable;
    @track tableData = '';
    @track dataTableName = ''
    @track filterData = ''
    objectId;
    // function calls - start
    clearData() {
        this.tableData = ''
    }
    createTableauLogRecord() {
        const fields = {};
        fields[DATA_VALUE_FIELD.fieldApiName] = JSON.stringify(this.tableData)
        const recordInput = { apiName: TABLEAU_LOG_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(object => {
                this.objectId = object.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Tableau Log record created, Id - ' + this.objectId,
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: error.body.message,
                        variant: 'error',
                    }),
                );
            });
    }
    getUnderlyingData() {
        console.log('getUnderlyingData : ', ' - start ')
        this.activeSheet = this.viz.getWorkbook().getActiveSheet()
        var options = {
            maxRows: 0, // Max rows to return. Use 0 to return all rows
            ignoreAliases: false,
            ignoreSelection: false,
            includeAllColumns: true
        };
        console.log('getUnderlyingData : ', ' - option set ')
        console.log('getUnderlyingData : ', ' -  async operation started ')
        this.activeSheet.getUnderlyingDataAsync(options)
            .then((t) => {
                this.activeTable = t
                this.tableData = this.tableData + JSON.stringify(this.activeTable.getData())
                this.dataTableName = this.activeTable.getName()
                console.log('getUnderlyingData : results ', this.tableData)                
            })
        console.log('getUnderlyingData : ', ' - end ')             
    }

    getFilterInfo() {
        //get the filter info as well
        console.log('getFilterInfo : ', ' - start ')
        this.activeFilterSheet = this.viz.getWorkbook().getActiveSheet()
        console.log('getFilterInfo : ', ' - after workbook before filter ')
        this.activeFilterSheet.getFiltersAsync()
            .then((f) => {
                console.log('filter data ', JSON.stringify(f))
                this.filterData = JSON.stringify(f)
            }) 
            .catch((e) => {
                this.filterData = ' Error ' + e
            })
        console.log('getFilterInfo : ', ' - end ')
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
          height: 400,
          hideTabs: false,
          hideToolbar: false,
          includeAllColumns: true,
          onFirstInteractive: function () {
            this.workbook = this.viz.getWorkbook();
            this.activeSheet = this.workbook.getActiveSheet();
          }
        };
        this.viz = new tableau.Viz(containerDiv, url, options);    
        // this is on marks selection
        this.viz.addEventListener(tableau.TableauEventName.MARKS_SELECTION, (marksEvent) => {
            this.onMarksSelection(marksEvent)
            console.log('on Marks Selection  Completed')
            // console.log('getting underlying data')
            // //get the underlying sheet data
            // dataOptions = {
            //     maxRows: 10, // Max rows to return. Use 0 to return all rows
            //     ignoreAliases: false,
            //     ignoreSelection: true,
            //     includeAllColumns: false
            // };            
            // this.activeSheet.getUnderlyingDataAsync(dataOptions)
            //     .then(function(t) {
            //         console.log('inside getting underlying data')
            //         var table = t
            //         this.tableData = jSON.stringify(table.getData())
            //     })
        })  
        // // this is on filter change
        // this.viz.addEventListener(tableau.TableauEventName.FILTER_CHANGE, (filterEvent) => {
        //     console.log('addEventListener FILTER_CHANGE', filterEvent)
        //     this.onFilterChange(filterEvent)
        // })          
    }
    onFilterChange(filterEvent) {
        console.log('onFilterselection ', filterEvent)
        return filterEvent.getFilterAsync()
            .then((Filter) => {
                console.log(' filter  ', Filter)
                this.getFilters(Filter)
            })
    }
    getFilters(Filter) {
        console.log('filter - ', Filter)
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
        html.push("\n")
        html.push("\n")
        this.tableData = html
        //html.push('Do you want create a new record from the JSON attributes.')
        //alert(html)
    }
    // function call -end
    async connectedCallback() {
        console.log('connected callback - start')
        await loadScript(this, tableauJSAPI);
        console.log('script loaded')
        this.isLibLoaded = true;
        console.log('rendering viz - start')        
        this.renderViz();
        console.log('rendering viz - end')
        console.log('connected callback - end')
    }

    renderedCallback() {
        Promise.all([loadScript(this, tableauJSAPI)])
        .then(() => {
          this.error = undefined;
          // Call back function if scripts loaded successfully
          console.log('tableau JS API resource load correctly')
          this.renderViz();
        })
        .catch(error => { 
        });        
        //this.renderViz();
    }

    render() {
        return templateMain;
    }    
}