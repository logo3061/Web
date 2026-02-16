// ASCII Password Maker
const passwort = "se12na34_new"; 

// Umwandlung in ASCII-Werte (durch Kommas getrennt)
const asciiHash = passwort.split('').map(char => char.charCodeAt(0)).join(',');

console.log("------------------------------------------");
console.log("DEIN PASSWORT ALS ASCII-KETTE:");
console.log(asciiHash); 
// Ergebnis: 72,101,108,108,99,97,116,52,48,57,48,83,116,117,100,105,111,115
console.log("------------------------------------------");
console.log("Kopiere diese Zahlenfolge in deine Datenbank!");