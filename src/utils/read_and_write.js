import fs from 'fs';
import path from 'path';


function read_file(filename) {
    let buffer = fs.readFileSync(path.resolve("database", filename) + ".json", "utf-8")
    return JSON.parse(buffer || null) || []
}


function write_file(filename, data) {
    return fs.writeFileSync(path.resolve("database", filename + ".json"),
        JSON.stringify(data, null, 2)
    );
}

export {
    read_file,
    write_file
}