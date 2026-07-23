import fs from 'node:fs/promises';

export default async (_dir, alt) => {
    try {
        let file = await fs.readFile(_dir, "utf8");
        return file ? JSON.parse(file) : alt;
    } catch {
        return alt;   
    }
}