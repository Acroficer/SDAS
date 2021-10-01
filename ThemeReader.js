const fs = require('fs');
const { builtinModules } = require('module');
require('dotenv').config();
const debugMode = Boolean(parseInt(process.env.Debug))
/*
    Theme formatting guide:
    Name - Name of the theme, as a string.
    BgType - Solid or Map, as a string.
    Bg - If BgType is solid, give it the index of the chosen colour. 
    TxtType, Txt - See above.
    Start - A starting date in the format MM.DD, as a number. Inclusive.
    End - An ending date in the format MM.DD, as a number. Exclusive.
*/


/*
    Gets the theme to apply for the day.
    Note that this doesn't just return the theme object itself, it modifies it so that it's of a consistent format
    For bg/txt type of map, it will load the maps into the theme object
    For bg/txt type of solid, it will generate a map, and load it into the theme object

    Map types look for their map file in ./themeMaps/<theme.Name>
*/
function getCurrentTheme(today = (new Date().getMonth() + 1) + parseFloat("0." + String(new Date().getDate())))
{

    var themes = JSON.parse(fs.readFileSync("./Themes.json"));
    var workingTheme = themes["Default"];
    Object.keys(themes).some(theme =>
        {
            if (themes[theme]["Name"] == "Default") //skip default
            {
                return false;
            }
            else //validates the theme
            {
                if (!validateTheme(themes[theme]))
                {
                    console.log(`Theme ${theme} uses invalid format.`);
                    return false;
                }
            }
            //Parse the date
            try
            {
                startDate = themes[theme]["Start"];
                endDate = themes[theme]["End"];

                //Now, compare and return if it fits.
                if (today >= startDate && today < endDate)
                {
                    workingTheme = themes[theme];
                    return true;
                }
            }
            catch (e)
            {
                console.log(`Date in theme ${themes[theme]["Name"]} is invalid.`)
            }
            
        })
        //If none fit, use default.
        
        //Now to translate it into a theme of the format:
        //Name - same
        //No start/end, they aren't needed
        //TxtMap - The map itself
        //BgMap - The map itself
        //In the event of a solid colour, we generate the map.

        var returnedTheme = {"Name" : workingTheme["Name"], "Bg" : null, "Txt": null};
        var bgMap;
        var txtMap;

        if (workingTheme["BgType"] == "Solid")
        {
            bgMap = Buffer.alloc(512, parseInt(workingTheme["Bg"]));
        }
        else if (workingTheme["BgType"] == "Map")
        {
            bgMap = fs.readFileSync(`./themeMaps/${workingTheme["Name"]}/Bg`);
        }

        if (workingTheme["TxtType"] == "Solid")
        {
            txtMap = Buffer.alloc(512, parseInt(workingTheme["Txt"]));
        }
        else if (workingTheme["TxtType"] == "Map")
        {
            txtMap = fs.readFileSync(`./themeMaps/${workingTheme["Txt"]}/Txt`);
        }

        //Mapping done, now to do the messages
        //Use default messages if none specified
        for(var i = 0; i < 5; i++)
        {
            var msg = `Msg${i}`;
            if (workingTheme[msg] == null)
            {
                workingTheme[msg] = themes["Default"][msg]; //replace missing with default
            }

            //Then do length checking and fixing
            if(workingTheme[msg].length == 32)
            {
                returnedTheme[msg] = workingTheme[msg];
            }
            else if (workingTheme[msg].length > 32)
            {
                console.log(`Theme ${workingTheme["Name"]} message ${msg} is too long, 32 char max.`);
                returnedTheme[msg] = themes["Default"][msg];
            }
            
            if (workingTheme[msg].length < 32) //if shorter, fill in leading zeroes.
            {
                var diff = 32 - workingTheme[msg].length;
                returnedTheme[msg] = " ".repeat(diff) + workingTheme[msg];
            }
            
        }
        returnedTheme.Bg = bgMap;
        returnedTheme.Txt = txtMap;
        return returnedTheme;
}

function validateTheme(theme)
{
    return (theme["Name"] && theme["Start"] && theme["End"] && theme["TxtType"] && theme["BgType"])
}

module.exports = getCurrentTheme;