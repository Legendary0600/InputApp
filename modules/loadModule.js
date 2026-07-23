import path from 'node:path';
import {app} from "electron";
import { pathToFileURL } from 'node:url';

const _path = app.getAppPath()

export default async (_dir, raw) => {
    const modulePath = path.join(_path, _dir);

    if (raw) return (await import(pathToFileURL(modulePath).href));
    return (await import(pathToFileURL(modulePath).href))?.default;
}
