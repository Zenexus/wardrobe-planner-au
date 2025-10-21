const { initializeFirebaseApp, restore } = require("firestore-export-import");
const serviceAccount_au = require("./credentials_au.json");

// Make sure change the 'credentials' when upload to the different database
initializeFirebaseApp(serviceAccount_au);

/* 
///////////////////////
======= AU Data =======
///////////////////////
*/
// restore("au/accessories.json");
// restore("au/bundles.json");
// restore("au/organisor.json");
restore("au/products.json");
