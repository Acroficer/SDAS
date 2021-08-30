//SectorDisk Active Sectors
//Displays how many active sectors there are
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
require('dotenv').config();

ssh = new NodeSSH();
const debugMode = Boolean(parseInt(process.env.Debug))
const sectorCount = parseInt(fs.readFileSync("./count"));

if(debugMode)
{
    console.log("Running in debug mode");
}



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
    ssh.execCommand('available').then(async function(result) {

        var output = result.stdout.split("sectors out of")[0].split("\n");
        var remainingSectors = output[output.length -1];
        
        try
        {
            parseInt(remainingSectors)
        }
        catch
        {
            throw new Error(`remainingSectors should be a number, instead is ${remainingSectors}`)
        }

        if (debugMode) console.log(`Sectors Claimed: ${remainingSectors}`);

        if (remainingSectors == sectorCount) //check if there's been a change, if not, terminate
        {
            if (debugMode) console.log("Count matches, terminating");
            ssh.dispose();
            return;
        }

        console.log(`Update in sector count detected. Old count: ${sectorCount}. New count: ${remainingSectors}`);
        //update the display first, then the file
        //if something goes wrong and it terminates during the process, we'd rather accidentally update the display twice, because the file never got updated
        //then think it is updated when it isn't.

        //Digits go from most to least significant
        var digits = []

        for(var i = 4; i > 0; i--)
        {
            if (remainingSectors[remainingSectors.length - i] != " ")
            {
                digits.push(remainingSectors[remainingSectors.length - i] + ".png") //push all digits into the array
            }
            else
            {
                digits = ["Blank.png"].concat(digits); //blanks appear at the end, but we want them at the beginning
            }
        }
        if (debugMode) console.log(`Digits: ${digits}`);
        //Now, use png2sector to fill them in.
        //png2sector <sector> <imgname>

        for(var i = 0; i < digits.length; i++)
        {
            if(!debugMode)
            {
                await ssh.execCommand(`png2sector ${parseInt(process.env.StartingSector) + i + 1} ${digits[i]}`).then((result) =>
                {
                    console.log(`Sector ${parseInt(process.env.StartingSector) + i + 1} : ${result.stdout}`);
                });
            }
        }

        //now to update the file
        if(!debugMode)
        {
            fs.writeFileSync("./count", remainingSectors);
        }
        ssh.dispose();
    });
});