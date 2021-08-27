const fs = require('fs')
const {NodeSSH} = require('node-ssh')
require('dotenv').config();

ssh = new NodeSSH();

if(process.env.Debug)
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
    console.log("Connected")
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

        console.log(`Sectors Claimed: ${remainingSectors}`);

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
        console.log(`Digits: ${digits}`);
        //Now, use png2sector to fill them in.
        //png2sector <sector> <imgname>

        for(var i = 0; i < digits.length; i++)
        {
            if(!process.env.Debug)
            {
                await ssh.execCommand(`png2sector ${parseInt(process.env.StartingSector) + i} ${digits[i]}`).then((result) =>
                {
                    console.log(`Sector ${parseInt(process.env.StartingSector) + i} : ${result.stdout}`);
                });
            }
        }
        ssh.dispose();
    });
});