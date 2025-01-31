import fs from "fs"
import csv from 'csv-parser'


export async function csvToJson(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                results.push(data);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });

}

export async function createCsv () {

    const headers = ['Name', 'Age', 'City', 'Country', 'Occupation'];
    const row = ['John Doe', '30', 'New York', 'USA', 'Engineer'];

    // Combine headers and row into a single CSV string
    const csvContent = [headers.join(','), row.join(',')].join('\n');

    // Write the CSV content to a file
    fs.writeFileSync('output.csv', csvContent);
}
