/**
 * Created by Admin on 06.05.2021.
 */

public with sharing class accountListTableController {

    @AuraEnabled(cacheable=true)
    public static List<Account> getAccountRecords() {
        return [SELECT Id, Name, Rating FROM Account];
    }

    @AuraEnabled
    public static void saveDraftValues(Object data) {
        List<Account> listOfAccounts = (List<Account>) JSON.deserialize(
                JSON.serialize(data),
                List<Account>.class
        );

        update listOfAccounts;
    }

    @AuraEnabled
    public static void deleteAccounts(List<Id> lstAccIds) {
        try {
            List<Account> lstAccToDelete = new List<Account>();
            for (Id idAcc : lstAccIds) {
                lstAccToDelete.add(new Account(Id = idAcc));
            }
            if (!lstAccToDelete.isEmpty()) {
                delete lstAccToDelete;
            }
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }

}