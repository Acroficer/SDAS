//SectorDisk Active Sectors
//Displays how many active sectors there are
const fs = require('fs')
const {NodeSSH} = require('node-ssh')
const getCurrentTheme = require("./ThemeReader.js");
require('dotenv').config();

ssh = new NodeSSH();
const debugMode = Boolean(parseInt(process.env.Debug))
const countData = JSON.parse(fs.readFileSync("./countData"));
var sectorCount = countData.count;
const lastTheme = countData.theme;

if(debugMode)
{
    console.log("Running in debug mode");
}

//First, load in the theme.
const theme = getCurrentTheme();
const background = theme.Bg;
const textOverlay = theme.Txt;

if (theme.Name != lastTheme) //if these are different, we want every digit to be overwritten. The easiest way to do this is to set the sectorCount to something nonsensical, so that no digits match.
{
    sectorCount = "EEEE"; //kind of a messy solution, find a better one.
}

function generateSector(num) //Generate a sector of number N. Takes it as a string so that we can also check for Blank.
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
                digits.push(remainingSectors[remainingSectors.length - i]) //push all digits into the array
            }
            else
            {
                digits = ["B"].concat(digits); //blanks appear at the end, but we want them at the beginning
            }
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
            
            var rawDigit = generateSector(digits[i]);

            if(!debugMode)
            {
                
            }
            else //in debug mode, just write it to output
            {
                fs.writeFileSync(`./debugOutput/${digits[i]}`, rawDigit);
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