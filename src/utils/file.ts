import fs from 'fs';
import { FormatData } from '../types';

const ensureOutDir = () => {
    const outDir = `${process.cwd()}/out`;
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
};

export const saveAsFile = (
    filename: string,
    context: string,
    formatData: FormatData
) => {
    ensureOutDir();
    fs.writeFileSync(`${process.cwd()}/out/${filename}.txt`, context, {
        flag: 'w',
    });
    fs.writeFileSync(
        `${process.cwd()}/out/${filename}.json`,
        JSON.stringify(formatData, null, 2),
        { flag: 'w' }
    );
};

export const getHtmlFromFile = (filename: string) =>
    new Promise<string>((resolve, reject) => {
        fs.readFile(`${process.cwd()}/out/${filename}.txt`, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data.toString());
        });
    });
