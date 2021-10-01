//SectorDisk Active Sectors
//Displays how many active sectors there are
const { Console } = require('console');
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
const getCurrentTheme = require("./ThemeReader.js");
require('dotenv').config();

ssh = new NodeSSH();
const debugMode = Boolean(parseInt(process.env.Debug))
const countData = JSON.parse(fs.readFileSync("./countData"));
var sectorCount = countData.count;
const lastTheme = countData.theme;

if(debugMode) console.log("Running in debug mode");


//First, load in the theme.
const theme = getCurrentTheme();
const background = theme.Bg;
const textOverlay = theme.Txt;

if (debugMode) console.log(`Using theme ${theme.Name}`)

if (theme.Name != lastTheme) //if these are different, we want every digit to be overwritten. The easiest way to do this is to set the sectorCount to something nonsensical, so that no digits match.
{
    sectorCount = "EEEE"; //kind of a messy solution, find a better one.
}

function generateSector(num, index) //Generate a sector of number N. Takes it as a string so that we can also check for Blank.
{
    var template;
    if (num == "Blank" || num == "B") //load blank template, otherwise parse
    {
        template = fs.readFileSync(`./content/raw_sectors/B`);
    }
    else
    {
        template = fs.readFileSync(`./content/raw_sectors/${parseInt(num)}`) //this will throw an error if num < 0 or num > 9. This is fine, as that should never happen, and I'd want to throw an error if it did anyway.
    }

    //Now, template will be read as a buffer. So we just gotta replace every byte with background if it's a 0, and overlay if it's 1.

    for(var i = 0; i < template.length; i++)
    {
        if (template[i] == 0) //if background..
        {
            template[i] = background[i];
        }
        else //if text..
        {
            template[i] = textOverlay[i];
        }
    }

    //Then, add the message to the end of the template
    var messageBuffer = Buffer.from(theme[`Msg${index + 1}`], "ascii"); //add 1 to the index because Msg0 is for SDTD
    //Always 32 long.
    for(var i = 480; i < 512; i++)
    {
        template[i] = messageBuffer[i - 480];
    }
    return template;

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
        remainingSectors = remainingSectors.replace(/ /g, ""); //Delete all empty spaces, since for some reason this is always 4char long, with empty spaces at the end if needed.

        for (var i = 0; i < 4 - remainingSectors.length; i++) //add a "B" for each blank space, at the front.
        {
            remainingSectors = "B" + remainingSectors;
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
            digits.push(remainingSectors[remainingSectors.length - i]) //push all digits into the array
        }



        if (debugMode) console.log(`Digits: ${digits}`);
        //Now, use png2sector to fill them in.
        //png2sector <sector> <imgname>

        var sectorCountStr = String(sectorCount)
        for (var i = 0; i < 4 - sectorCountStr.length; i++) //add a "B" for each blank space
        {
            sectorCountStr = "B" + sectorCountStr;
        }
        for(var i = 0; i < digits.length; i++)
        {
            //Only upload the digit if it doesn't match what is already there.
            if (digits[i][0] == sectorCountStr[i])
            {
                if(debugMode) console.log(`Digit ${i}: ${digits[i]} is unchanged, skipping...`);
                continue;
            }

            if(!debugMode) //upload. This code is a bit messy. putFile can't take raw data, only files. So a file must be created just to upload.
            {
                var currentSector = parseInt(process.env.StartingSector) + 1 + i;
                fs.writeFileSync(`./output`, generateSector(digits[i], i));
                await ssh.putFile(`./output`, `/usr/local/share/sectors/${currentSector}`).then(function(result){
                    console.log(result);
                });
            }
            else //in debug mode, just write it to output
            {
                fs.writeFileSync(`./debugOutput/${digits[i]}`, generateSector(digits[i], i));
            }
        }

        //now to update the file
        if(!debugMode)
        {
            fs.writeFileSync("./countData", JSON.stringify({
                count: digits.join(""),
                theme: theme.Name
            }));
        }
        ssh.dispose();
    });
});