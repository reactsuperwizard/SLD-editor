import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import { Subject, Observable, forkJoin } from 'rxjs';
import { map, flatMap, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

import { config } from '../config';

/**
 * SLD Util service
 */
@Injectable()
export class SldUtilService {

    public specialUserActionSubject = new Subject();
    public linkCreatedSubject = new Subject<any>();
    public userAreaDrawnSubject = new Subject();
    public diagramLoadedSubject = new Subject();
    public nodeAddedSubject = new Subject<any>();
    // substation JSON specific objects
    private substation: any;
    private nodes: any;
    private links: any;

    constructor(private http: HttpClient) { }

    /**
     * returns a deep copy of object
     * @param obj the object to be deep coped
     */
    public static deepCopy(obj: any) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * load widget json file, fetch the SLD-data template json for each widget
     * compile it alltogether and serve
     */
    public getWidgetDefinitions(): Observable<any> {
        return this.http.get(config.ASSETS_DIR + 'widgets.json')
            .pipe(flatMap(allWidgets => {
                return forkJoin((allWidgets as any[]).map(widget => {
                    return this.http
                        .get(config.ASSETS_DIR + 'data-templates/' + widget.name + '.json')
                        .pipe(map(template => {
                            widget.sldData = template;
                            return widget;
                        }));
                }));
            }));
    }

    /**
     * get link data template
     * fetches the data template for links (aka ideal cables)
     */
    public getLinkDataTemplate(): Observable<any> {
        return this.http.get(config.ASSETS_DIR + 'data-templates/ideal-cable.json');
    }

    /**
     * get outage area template
     * fetches the data template for outage area
     */
    public getOutageAreaTemplate(): Observable<any> {
        return this.http.get(config.ASSETS_DIR + 'data-templates/outage-area.json');
    }

    /**
     * get bay template
     * fetches the data template for bay
     */
    public getBayTemplate(): Observable<any> {
        return this.http.get(config.ASSETS_DIR + 'data-templates/bay.json');
    }

    /**
     * assign reliability data
     * fetches the mock reliability data json file,
     * and inserts the values into the selected comopnents
     */
    public assignReliabilityData(nodesData: any): Observable<any> {
        return this.http.get(config.ASSETS_DIR + 'mock-reliability-data.json')
            .pipe(tap(reliability => {
                nodesData.forEach(data => {
                    data.sldData.condition = reliability.condition;
                    data.sldData.importance = reliability.importance;
                    data.sldData.risk = reliability.risk;
                });
            }));
    }

    /**
     * validate the imported substation JSON file
     * very basic but critical validation
     */
    private parseSubstationJSONForErrors(substation, standard: string): string {
        const defaultError = 'Error importing substation JSON';
        if (!substation.serializedSld) {
            return defaultError;
        }
        if (substation.serializedSld.standard !== standard) {
            return 'Diagram doesn\'t use ' + standard.toUpperCase() + ' standard';
        }
        if (substation.serializedSld.nodes &&
            substation.serializedSld.links &&
            substation.serializedSld.sldReferenceIter &&
            substation.serializedSld.selectedKeys) {
                return null;
            }
        return defaultError;
    }

    /**
     * import substation json file
     * reads an existing substation JSON,
     * and holds that new object in memory
     * used in importing a diagram / creating a new diagram
     */
    public importSubstationJSONFile(standard: string, substationJSONFile?: any): Observable<any> {
        let fileLoadedObservable = null;
        if (substationJSONFile) {
            // read the substation json file
            const reader = new FileReader();
            fileLoadedObservable = new Observable(observer => {
                reader.onload = (event) => {
                    const result = JSON.parse((event.target as any).result);
                    observer.next(result);
                    observer.complete();
                };
                reader.readAsText(substationJSONFile);
            });
        } else {
            // get the initial template of substation and set the appropriate fields
            fileLoadedObservable = this.http.get(config.ASSETS_DIR + 'data-templates/substation-' + standard + '.json');
        }

        // setup in memory substation and return the serialized version to SLD editor
        return fileLoadedObservable
            .pipe(tap(substation => {
                const error = this.parseSubstationJSONForErrors(substation, standard);
                if (!error) {
                    // JSON is valid, so reset the in memory objects to null
                    this.substation = null;
                    this.nodes = null;
                    this.links = null;
                    return;
                }
                throw new Error(error);
            }))
            .pipe(map(substation => {
                this.substation = substation;
                this.nodes = this.substation.serializedSld.nodes;
                this.links = this.substation.serializedSld.links;
                this.substation.serializedSld.baysList = this.substation.serializedSld.baysList
                    || this.substation.bays;

                // attach the sld data objects on each widget
                const sldDataObjects = [].concat(
                    this.substation.psLs,
                    this.substation.busbars,
                    this.substation.outageAreasList,
                    ...this.substation.bays.map(bay => bay.allComponents)
                );
                const nodesAndLinks = this.nodes.concat(this.links);
                sldDataObjects.forEach(sldData => {
                    const component = nodesAndLinks
                        .filter(n => n.sldReference === sldData.sldReference)[0];
                    component.sldData = sldData;
                });

                return this.substation.serializedSld;
            }));
    }


    /**
     * update the Substation JSON
     */
    public updateSubstationJSON(diagramName: string, sldReferenceIter: number, simulation: string,
            selectedKeys: any[], outageAreasList: any[], baysList: any[], standard: string) {
        if (!this.substation) { return; }

        this.substation.serializedSld.nodes = this.nodes
            .map(node => Object.assign({}, node, { sldData: null }));
        this.substation.serializedSld.links = this.links
            .map(node => Object.assign({}, node, { sldData: null }));
        this.substation.serializedSld.diagramName = diagramName;
        this.substation.serializedSld.simulation = simulation;
        this.substation.serializedSld.sldReferenceIter = sldReferenceIter;
        this.substation.serializedSld.selectedKeys = selectedKeys;
        this.substation.serializedSld.outageAreasList = outageAreasList;
        this.substation.serializedSld.baysList = baysList;
        this.substation.standard = standard;


        // update all the standard components + all links list in the bays
        this.substation.bays = baysList.map(bay => Object.assign(
            {},
            bay,
            {
                allComponents: this.nodes.concat(this.links)
                    .filter(component => !component.category && !component.class)
                    .filter(component => component.bay === bay.bayName || (!component.bay && bay.isDefault))
                    .map(component => component.sldData)
            }
        ));


        // update the power-supply and loads
        this.substation.psLs = this.nodes
            .filter(node => node.class === 'power-supply' || node.class === 'load')
            .map(node => node.sldData);

        // busbars
        this.substation.busbars = this.nodes
            .filter(node => node.class === 'busbar')
            .map(node => node.sldData);

        // outage areas
        this.substation.outageAreasList = outageAreasList
            .map(outageArea => Object.assign(
                {},
                outageArea,
                {
                    outageAreaComponentsList: this.nodes
                        .filter(node => !node.category && node.outageArea === outageArea.outageAreaName)
                        .map(node => node.sldReference)
                }
            ));
    }


    /**
     * export the substation JSON
     */
    public exportSubstationJSON() {
        const blob = new Blob([JSON.stringify(this.substation, null, 4)], { type: 'application/json' });
        FileSaver.saveAs(blob, this.substation.serializedSld.diagramName + '.json');

    }

    /**
     * export the component data
     */
    public exportComponentData() {
        const sldDatas = this.nodes
            .filter(node => !node.category)
            .concat(this.links)
            .map(node => node.sldData);

        if (!sldDatas.length) {
            return false;
        }


        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        const workbookData = {};
        // compile the list of data keys for each component type
        const blacklistedKeys = [
            'assetId',
            'assetName',
            'connectedComponentsFirst',
            'connectedComponentsSecond',
            'connectedComponentsList',
            'isOpen',
            'outForFault',
            'outForMaintenance',
            'outForIsolation',
        ];
        sldDatas.forEach(data => {
            const excelKeys = ['sldReference'].concat(
                Object.keys(data).filter(key => blacklistedKeys.indexOf(key) === -1 && key !== 'sldReference')
            );
            // set the header row if required
            workbookData[data.assetName] = workbookData[data.assetName] || [excelKeys];
            // if the particular component instance has more fields than present in
            // in the current excel header, push those keys in the header
            excelKeys.forEach(key => {
                if (workbookData[data.assetName][0].indexOf(key) === -1) {
                    workbookData[data.assetName][0].push(key);
                }
            });
        });
        // define the groups of keys in excel
        const groups = [
            {
                name: 'Reliability Data',
                keys: ['condition', 'importance', 'risk']
            }
        ];
        const merges = {};
        // group the keys in excel data sheets
        Object.keys(workbookData).forEach(sheetName => {
            const sheetData = workbookData[sheetName];
            const allGroupedKeys = [].concat(...groups.map(group => group.keys));
            sheetData[1] = sheetData[0].filter(key => allGroupedKeys.indexOf(key) === -1);
            sheetData[0] = ['General'].concat(sheetData[1].slice(1).map(() => ''));

            merges[sheetName] = [{ s: { r: 1, c: 0 }, e: { r: sheetData[1].length - 1, c: 0 } }];

            groups.forEach(group => {
                merges[sheetName].push(
                    { s: { r: sheetData[1].length + 1, c: 0 }, e: { r: sheetData[1].length + group.keys.length - 1, c: 0 } }
                );
                sheetData[0] = sheetData[0].concat([group.name].concat(group.keys.slice(1).map(() => '')));
                sheetData[1] = sheetData[1].concat(group.keys);
            });
        });
        // add all the data rows
        sldDatas.forEach(data => {
            // push the data row of the component
            const dataRow = workbookData[data.assetName][1].map(key => data[key]);
            workbookData[data.assetName].push(dataRow);
        });

        // traspose the data matrix so that it's in "vertical-format" in excel
        Object.keys(workbookData).forEach(sheetName => {
            const sheetData = workbookData[sheetName];
            const transposedSheetData = sheetData[0].map((col, i) => sheetData.map(row => row[i]));
            workbookData[sheetName] = transposedSheetData;
        });

        // compile all the data into xlsx workbook
        Object.keys(workbookData).forEach(sheetName => {
            const sheetData = workbookData[sheetName];
            const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
            worksheet['!merges'] = merges[sheetName];
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        // write the file and download
        XLSX.writeFile(workbook, this.substation.serializedSld.diagramName + '-Component-Data.xlsx');

        return true;
    }

    /**
     * import component data
     * read the excel file imported and replace the sld data for each component with the imported values
     */
    public importComponentData(file): Observable<any> {
        const reader: FileReader = new FileReader();
        const componentDataImportedObservable = new Observable(observer => {
            reader.onload = (e: any) => {
                try {
                    // read workbook
                    const binaryString: string = e.target.result;
                    const workbook: XLSX.WorkBook = XLSX.read(binaryString, { type: 'binary' });

                    // parse through all the sheets
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
                        const sheetData = (XLSX.utils.sheet_to_json(worksheet, { header: 1 }));

                        const sldRefs = (sheetData[0] as any[]).slice(2);
                        const dataKeys = sheetData.slice(1).map(row => row[1]);
                        const dataValues = sheetData.slice(1).map(row => (row as any[]).slice(2));

                        // compile all the modified sldDatas
                        const modifiedSldDatas = sldRefs.map(() => ({}));
                        dataKeys.forEach((key, keyIndex) => {
                            const fieldValues = dataValues[keyIndex];
                            fieldValues.forEach((value, componentIndex) => {
                                if (value) {
                                    modifiedSldDatas[componentIndex][key] = value;
                                }
                            });
                        });

                        // edit the sldDatas of components in diagram
                        sldRefs.forEach((ref, index) => {
                            const component = this.nodes.concat(this.links)
                                .filter(c => c.sldReference === ref)[0];
                            if (!component) { return; }

                            component.sldData = Object.assign({ }, component.sldData, modifiedSldDatas[index]);
                        });
                    });
                    observer.next();
                    observer.complete();

                } catch (error) {
                    observer.error();
                    throw error;
                }
            };
            reader.readAsBinaryString(file);
        });
        return componentDataImportedObservable;
    }

    /**
     * download the dummy component data excel
     */
    public downloadEquipmentData() {
        this.http.get(config.ASSETS_DIR + 'component-data.xlsx', { responseType: 'blob' })
            .subscribe(blob => {
                FileSaver.saveAs(blob, 'component-data.xlsx');
            });
    }

    /**
     * download blob as image
     */
    public downloadBlobAsImage(blob, name) {
        FileSaver.saveAs(blob, name + '.png');
    }

}
