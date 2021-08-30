//SectorDisk Today's Date
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
require('dotenv').config();

ssh = new NodeSSH();
const debugMode = Boolean(parseInt(process.env.Debug))

if(debugMode)
{
    console.log("Running in debug mode");
}

const numbers = {
    0: [1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1],

    1: [0, 1, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        0, 0, 1, 1, 0, 0,
        1, 1, 1, 1, 1, 1],

    2: [1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1],
        
    3: [1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1],
        
    4: [1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1],

    5: [1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1],

    6: [1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1],

    7: [1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1],

    8: [1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1],

    9: [1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 0, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1,
        0, 0, 0, 0, 0, 1],
}
const insertionPoints = [[1, 1], [9,1], [1, 11], [9, 11], [1, 21], [9, 21]];
const ignoredRows = [0, 10, 20, 30, 31];
const ignoredColumns = [0, 7, 8, 15];
//get today's date
const today = new Date(Date.now());
const year = String(today.getFullYear()).substr(2);
const month = String(today.getMonth() + 1).length > 1 ? String(today.getMonth() + 1) : "0" + String(today.getMonth() + 1);
const day = String(today.getDate()).length > 1 ? String(today.getDate()) : "0" + String(today.getDate());
const date = day + month + year;
console.log(`${day}/${month}/${year} or ${date}`);

var rawTemplate = fs.readFileSync("./Template");
var template = [];

for (var i = 0; i < 32; i++) //load the template file into a list of rows
{
    template.push(rawTemplate.slice(0, 16));
    rawTemplate = rawTemplate.slice(16);
}

for (var i = 0; i < date.length; i++)
{
    var num = parseInt(date[i]);
    var horzOffset = 1 + 8*(i % 2);
    var vertOffset = 1 + 10*(Math.floor(i/2));

    for(var y = 0; y < 9; y++)
    {
        for(var x = 0; x < 6; x++)
        {
            template[y + vertOffset][x + horzOffset] = numbers[String(num)][x + y*6];
        }
    }
}

//Now re-assemble the template, not as a list
template = Buffer.concat(template);

fs.writeFileSync("./output", template);

//Now to convert it to hexadecimal
hexList = "";
for (var i = 0; i < template.length; i++)
{
    hexList += template[i].toString(16);
}
console.log(hexList);
//Now, upload it.

ssh.connect({
    host: process.env.SSH_Host,
    username: process.env.SSH_User,
    port: process.env.SSH_Port,
    password: process.env.SSH_Password,
    tryKeyboard: true,
    onKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
        if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
          finish([process.env.SSH_Password])
        }
      }
}).then(function() {
    if (debugMode) console.log("Connected");

    ssh.putFile(`./output`, `/usr/local/share/sectors/${process.env.StartingSector}`).then(function(result){
        console.log(result);
        ssh.dispose();
    });
});