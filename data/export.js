const fs = require("fs");
const { initializeFirebaseApp, backups } = require("firestore-export-import");
const serviceAccount_au = require("./credentials_au.json");

/*
========================================================
============ Export The Data From Firestore ============
========================================================
*/

// 1. Select Service Account (Make sure double check the target Database)
initializeFirebaseApp(serviceAccount_au);

const exportData = (regionPath, collectionName) => {
  backups([`${collectionName}`])
    .then((collections) => {
      const data = JSON.stringify(collections);

      // Execute save file function
      fs.writeFile(`./${regionPath}/${collectionName}.json`, data, (err) => {
        if (err) {
          return console.log(err);
        } else {
          console.log(`${collectionName}.json was created.`);
        }
      });
    })
    .catch((err) => console.log(`${err}`));
};

/*
=============================================
============ Run Export Function ============
=============================================
Passing Following Parameters
- directory path: string // 'au' | 'nz'
- collectionName:string //  'products' | 'draggableItems' | '400kg_430mm_shelves' | '400kg_530mm_shelves' | '1000kg_shelves' | 'wall_shelves' | 'customers' | 'templates'
*/
exportData("nz", "products");
