import { createFsFromVolume, Volume } from "memfs"
import fs from 'fs'
import path from 'path'

const IS_TEST = process.env.NODE_ENV == "test"
const json = {
    '/dist/mock.json': '1',
    '/dist/static/mock.js': '2'
};
const mockFs = createFsFromVolume(Volume.fromJSON(json))
export const engineFs = IS_TEST ? mockFs : fs


function cacheBaseDir(viewDirectory: string): string {
    return IS_TEST ? '/dist' : path.join(viewDirectory, '..', 'dist')
}
function cacheName(viewDirectory: string): string {
    return path.join(cacheBaseDir(viewDirectory), 'react-ssr-cache.json')
}

export interface ReactSSRCache {
    [key: string]: { contentPath: string, component?: any, hash?: string }
}

export const getCache = (viewDirectory: string): ReactSSRCache => {
    return JSON.parse(engineFs.readFileSync(cacheName(viewDirectory)).toString())
}

export const updateCache = (viewDirectory: string, cache: ReactSSRCache) => {
    engineFs.writeFileSync(cacheName(viewDirectory), JSON.stringify(cache))
}

export const getStaticDir = (viewDirectory: string): string => {
    return path.join(cacheBaseDir(viewDirectory), 'static')
}