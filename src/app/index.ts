#!/usr/bin/env node

import * as fs from 'fs';
import * as qrcode from 'qrcode';

import { Command } from 'commander';
import { readFile } from 'fs/promises';

const lzw = require('lzw');

//json format
const command = new Command();
command.version('1.0.0');
const strConfig = `{
    "input_path": "",
    "output_path": "",
    "isMin": false
}
`;

//validator from error 
const validator = {
    validateFileExtension: (fileName: string, expected: string) => {
        const extensionReceived = fileName.split('.')[1];
        if (extensionReceived === expected) {
            return;
        } else {
            const msg = `Invalid file type, expected: '${expected}'`;
            throw new Error(msg);
        }
    }
}

const qrsService = {
    codeMin: (htmlFileStr: string) => {
        let replacedCode = htmlFileStr;
        replacedCode.replace('¤', '¤¤');
        replacedCode.replace('<script>', '¤ts');
        replacedCode.replace('</script>', '¤ts/');
        replacedCode.replace('<html>', '¤th');
        replacedCode.replace('</html>', '¤th/');
        replacedCode.replace('<body>', '¤tb');
        replacedCode.replace('</body>', '¤tb/');
        replacedCode.replace('<header>', '¤the');
        replacedCode.replace('</header>', '¤the/');
        replacedCode.replace('<style>', '¤tst');
        replacedCode.replace('</style>', '¤tst/');
        replacedCode.replace('<img', '¤ti');
        replacedCode.replace('<footer', '¤tf');
        replacedCode.replace('<div', '¤td');
        replacedCode.replace('</div>', '¤td/');
        replacedCode.replace('<nav', '¤tn');
        replacedCode.replace('</nav>', '¤tn')
        //properties
        replacedCode.replace('placeholder', '¤pp');
        replacedCode.replace(' style', '¤ps');
        replacedCode.replace('hidden', '¤ph');
        replacedCode.replace('type', '¤pt');
        replacedCode.replace('class=', '¤pc');
        //js
        replacedCode.replace('alert(', '¤ja');
        replacedCode.replace('function', '¤jf');
        replacedCode.replace('getElementById(', '¤jg');
        replacedCode.replace('toString()', '¤jt');
        replacedCode.replace('¤¤', '¤');
        return replacedCode;
    },
    addIndexToPath: (path: string, index: number) => {
        const splitPath = path.split('.');
        const finalPath = splitPath[0] + `_${index}.${splitPath[1]}`;
        return finalPath;
    },
    minify: () => {
        
    }
}

//cli functions qrss
const qrs = {
    //init configuration
    'init': () => {
        try {
            fs.writeFileSync('./qrs-config.json', strConfig);
        } catch(error) {
            console.log('error', error);
            throw new Error(error);
        }
    },
    'build': async () => {
        const qrsConfigFile = fs.readFileSync('./qrs-config.json');
        const qrsConfig: { 
            input_path: string,
            output_path: string
        } = JSON.parse(qrsConfigFile.toString());
        const { input_path, output_path } = qrsConfig;
        validator.validateFileExtension(input_path, 'html');





        const buffer = await readFile(input_path);
        const htmlFileStr = buffer.toString();
        let compressed = lzw.compress(qrsService.codeMin(htmlFileStr));
        const strCompressed: string = compressed.toString();
        const iterations = strCompressed.length / 2364;
        let strStart = 0;
        let strFinal = 0;
        const strSplitList = [];
        for (let i = 0; i < iterations; i++) {
            strFinal = strFinal + 2364;
            const strSplit = strCompressed.substring(strStart, strFinal);
            strSplitList.push(( i + 1) + '-' + strSplit);
            strStart = strFinal;
        }
        if (strCompressed.length % iterations !== 0) {
            const strSplit = strCompressed.substring(
                strCompressed.length - strFinal,
                strCompressed.length
            );
            strSplitList.push(strSplit);
        }
        strSplitList.forEach(async (strSplit, index) => {
            const finalPath = qrsService.addIndexToPath(output_path, index);
            await qrcode.toFile(
                finalPath,
                strSplit, 
                {
                    type: 'png',
                    version: 40,
                    scale: 2,
                    width: 177,
                    errorCorrectionLevel: 'L',
                }
            );
        });
    },
    'reverse': () => {}
}
//
command.command('qrs [option]')
.description('create the config file of type json.')
.action((option) => qrs[option]());

command.parse(process.argv);
