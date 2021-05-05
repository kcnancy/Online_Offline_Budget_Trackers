let db;
let budgetVersion;

// create a new db request for a "budget" database.
const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log("IndexDB needs upgrade");

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(
    "DB successfully upgraded from version ${oldVersion} to ${newVersion}"
  );

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("checking db");

  // Opens a transaction on BudgetStore
  let transaction = db.transaction(["BudgetStore"], "readwrite");

  //  BudgetStore object
  const store = transaction.objectStore("BudgetStore");

  // Get all records from store
  const getAll = store.getAll();

  //Successful request
  getAll.onsuccess = function () {
    //Take any line items currently in the store and add them when back online
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");

            const currentStore = transaction.objectStore("BudgetStore");

            // Clear existing entries because our bulk add was successful
            currentStore.clear();
            console.log("Clearing store 🧹");
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log("success");
  db = e.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    console.log("Backend online! 🗄️");
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log("Save record invoked");
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");

  //add record to store
  store.add(record);
};

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
