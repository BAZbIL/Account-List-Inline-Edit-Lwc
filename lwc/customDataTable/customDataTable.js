/**
 * Created by Admin on 10.05.2021.
 */

import LightningDatatable from 'lightning/datatable';
import DatatablePicklistTemplate from './picklistTemplate.html';

export default class CustomDataTable extends LightningDatatable {

    static customTypes = {
        picklist: {
            template: DatatablePicklistTemplate,
            standardCellLayout: true,
            typeAttributes: ['label', 'placeholder', 'options', 'value', 'context', 'variant', 'name']
        }
    };

}