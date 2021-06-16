import {LightningElement, wire, api} from 'lwc';
import {refreshApex} from '@salesforce/apex';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getAccountRecords from '@salesforce/apex/accountListTableController.getAccountRecords';
import saveDraftValues from '@salesforce/apex/accountListTableController.saveDraftValues';
import deleteAccounts from '@salesforce/apex/accountListTableController.deleteAccounts';

const COLUMNS_EDITABLE_ACTIVATE = [
    {label: 'Account Name', fieldName: 'Name', type: 'text', editable: true},
    {
        label: 'Rating',
        fieldName: 'Rating',
        type: 'picklist',
        editable: true,
        typeAttributes: {
            placeholder: 'Choose Rating',
            options: [
                {label: 'Hot', value: 'Hot'},
                {label: 'Warm', value: 'Warm'},
                {label: 'Cold', value: 'Cold'}
            ],
            value: {fieldName: 'Rating'},
            context: {fieldName: 'Id'},
            variant: 'label-hidden',
            name: 'Rating',
            label: 'Rating'
        },
        cellAttributes: {
            class: {fieldName: 'ratingClass'}
        }
    },
    {
        type: 'button-icon', label: 'Action', initialWidth: 75, typeAttributes: {
            iconName: 'action:delete', title: 'Delete', name: 'delete_account',
            variant: 'border-filled', alternativeText: 'Delete'
        }
    }
];

const COLUMNS_EDITABLE_DEACTIVATE = [
    {label: 'Account Name', fieldName: 'Name', type: 'text'},
    {label: 'Rating', fieldName: 'Rating', type: 'text'},

    {
        type: 'button-icon', label: 'Action', initialWidth: 75, typeAttributes: {
            iconName: 'action:delete', title: 'Delete', name: 'delete_account',
            variant: 'border-filled', alternativeText: 'Delete'
        }
    }
];

export default class AccountListTable extends LightningElement {

    @api recordId;
    columnsEditableActivate = COLUMNS_EDITABLE_ACTIVATE;
    columnsEditableDeactivate = COLUMNS_EDITABLE_DEACTIVATE;
    records;
    lastSavedData;
    error;
    wiredRecords;
    showHidePencil = true;
    showSpinner = false;
    draftValues = [];
    privateChildren = {};

    renderedCallback() {
        if (!this.isComponentLoaded) {
            window.addEventListener('click', (evt) => {
                this.handleWindowOnclick(evt);
            });
            this.isComponentLoaded = true;
        }
    }

    disconnectedCallback() {
        window.removeEventListener('click', () => {
        });
    }

    handleWindowOnclick(context) {
        this.resetPopups('c-datatable-picklist', context);
    }

    resetPopups(markup, context) {
        let elementMarkup = this.privateChildren[markup];
        if (elementMarkup) {
            Object.values(elementMarkup).forEach((element) => {
                element.callbacks.reset(context);
            });
        }
    }

    @wire(getAccountRecords)
    wiredRelatedRecords(result) {
        this.wiredRecords = result;
        const {data, error} = result;
        if (data) {
            this.records = JSON.parse(JSON.stringify(data));
            this.records.forEach(record => {
                record.ratingClass = 'slds-cell-edit';
            });
            this.error = undefined;
        } else if (error) {
            this.records = undefined;
            this.error = error;
        } else {
            this.error = undefined;
            this.records = undefined;
        }
        this.lastSavedData = this.records;
        this.showSpinner = false;
    }

    handleItemRegister(event) {
        event.stopPropagation();
        const item = event.detail;
        if (!this.privateChildren.hasOwnProperty(item.name))
            this.privateChildren[item.name] = {};
        this.privateChildren[item.name][item.guid] = item;
    }

    handleRowAction(event) {
        const row = event.detail.row;
        if (event.detail.action.name === 'delete_account') {
            this.record = event.detail.row;
            this.deleteCurrentAccounts(row);
        }
    }

    deleteCurrentAccounts(currentRow) {
        let currentRecord = [];
        currentRecord.push(currentRow.Id);
        deleteAccounts({lstOppIds: currentRecord})
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success delete:)',
                    message: currentRow.Name + ' ' + ' Account deleted.',
                    variant: 'success'
                }),);

                return refreshApex(this.wiredRecords);
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error delete:(',
                    message: error.message,
                    variant: 'error'
                }),);
            });
    }

    handleCellChange(event) {
        event.preventDefault();
        this.updateDraftValues(event.detail.draftValues[0]);
    }

    picklistValueChange(event) {
        event.stopPropagation();
        let dataReceived = event.detail.data;
        let updatedItem;
        switch (dataReceived.label) {
            case 'Rating':
                updatedItem = {
                    Id: dataReceived.context,
                    Rating: dataReceived.value
                };
                this.setClassesOnData(
                    dataReceived.context,
                    'ratingClass',
                    'slds-cell-edit slds-is-edited'
                );
                break;
            default:
                this.setClassesOnData(dataReceived.context, '', '');
                break;

        }
        this.updateDataValues(updatedItem);
        this.updateDraftValues(updatedItem);
    }

    updateDataValues(updateItem) {
        let copyData = JSON.parse(JSON.stringify(this.records));
        copyData.forEach((item) => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });
        this.records = [...copyData];
    }

    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = JSON.parse(JSON.stringify(this.draftValues));
        copyDraftValues.forEach((item) => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
        this.showHidePencil = false;
    }

    picklistEdit(event) {
        event.preventDefault();
        let dataReceived = event.detail.data;
        this.handleWindowOnclick(dataReceived.context);
        switch (dataReceived.label) {
            case 'Rating':
                this.setClassesOnData(
                    dataReceived.context,
                    'ratingClass',
                    'slds-cell-edit'
                );
                break;
            default:
                this.setClassesOnData(dataReceived.context, '', '');
                break;
        }
    }

    setClassesOnData(id, fieldName, fieldValue) {
        this.records = JSON.parse(JSON.stringify(this.records));
        this.records.forEach((detail) => {
            if (detail.Id === id) {
                detail[fieldName] = fieldValue;
            }
        });
    }

    cancelInlineEdit(event) {
        event.preventDefault();
        this.records = JSON.parse(JSON.stringify(this.lastSavedData));
        this.handleWindowOnclick('reset');
        this.draftValues = [];
        this.showHidePencil = true;
    }

    saveInlineEdit(event) {
        event.preventDefault();
        this.showSpinner = true;
        saveDraftValues({data: this.draftValues})
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account updated successfully',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredRecords).then(() => {
                    this.records.forEach(record => {
                        record.ratingClass = 'slds-cell-edit';
                    });
                    this.draftValues = [];
                });
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
                this.showSpinner = false;
            });
        this.showHidePencil = true;
    }

}