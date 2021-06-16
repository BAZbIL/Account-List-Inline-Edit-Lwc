@IsTest
private class accountListTableControllerTest {

    @TestSetup
    static void setup() {
        List<Account> testAccount = new List<Account>();
        for (Integer i = 0; i < 2; i++) {
            testAccount.add(new Account(Name = 'testAccount' + i));
        }

        insert testAccount;
    }

    @IsTest
    static void getAccountRecordsTest() {

        Test.startTest();
        List<Account> accounts = accountListTableController.getAccountRecords();
        Test.stopTest();

        List<Account> createdAccounts = [
                SELECT Name, Rating, Id
                FROM Account
        ];
        for (Integer i = 0; i < accounts.size(); i++) {
            System.assert(accounts[i].Name == createdAccounts[i].Name);
            System.assert(accounts[i].Rating == createdAccounts[i].Rating);
            System.assert(accounts[i].Id == createdAccounts[i].Id);
        }
    }

    @IsTest
    static void saveDraftValuesTest() {
        Account[] acct = new Account[]{
        };

        Test.startTest();
        accountListTableController.saveDraftValues(acct);
        Test.stopTest();

        Account newAccount = new Account(Name = 'TestNewName', Rating = 'TestNewRating');

        System.assertNotEquals('NewTest', newAccount.Rating);
        System.assertNotEquals('NewTest2', newAccount.Name);
    }

    @IsTest
    static void deleteAccountsTest() {
        List<Id> listTest = new List<Id>();
        Id testAccount;
        Account deleteAccount = [
                SELECT Id
                FROM Account
                LIMIT 1
        ];
        listTest.add(testAccount);
        delete deleteAccount;

        Test.startTest();
        try {
            accountListTableController.deleteAccounts(listTest);
        } catch (Exception e) {

        }
        Test.stopTest();

        System.assertEquals(1, [SELECT Id FROM Account].size());
    }

}
