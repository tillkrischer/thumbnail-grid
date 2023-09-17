import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';

const dir = process.env.DIR;
const mtPath = "/usr/src/app/mt"
const minAge = 1000 * 60 * 10
const maxAge = 1000 * 60 * 60 * 24

function* getFiles(dir: string): Iterable<string> {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}

const processVideoFfmpeg = (file: string) => {
    const p = path.parse(file)
    const pngPath = `${p.dir}/${p.name}.jpg`
    if (!fs.existsSync(pngPath)) {
        const fpsResult = child_process.execSync(`ffprobe -v 0 -of csv=p=0 -select_streams v:0 -show_entries stream=r_frame_rate ${file}`).toString();
        const framesResult = child_process.execSync(`ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 ${file}`).toString();
        const fpsMatch = fpsResult.match(/(\d+)\/(\d+)/);
        const framesMatch = framesResult.match(/(\d+)/);

        if (fpsMatch && framesMatch) {
            const frameIncrement = Math.floor(60 * Number(fpsMatch[1]) / Number(fpsMatch[2]));
            const frameCount = Number(framesMatch[1]);
            const rows = Math.ceil(frameCount / (frameIncrement * 5));

            const timestampfilter = `drawtext=timecode='00\\\\:00\\\\:00\\\\:00':r=30:fontcolor=white:fontsize=92:x=20:y=20:box=1:boxcolor=black@0.5`
            const tilingfilter = `select=not(mod(n\\,${frameIncrement})),tile=5x${rows}`
            const command = `ffmpeg -i ${file} -n -vf "${timestampfilter},${tilingfilter}" -vsync 0 ${pngPath}`;
            child_process.execSync(command);
        }
    }
}

const formatTimestamp = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

const processVideoMt = (file: string) => {
    const p = path.parse(file)
    const pngPath = `${p.dir}/${p.name}.jpg`
    if (!fs.existsSync(pngPath)) {
        const durationResult = child_process.execSync(`ffprobe -i ${file} -show_entries format=duration -v quiet -of csv="p=0"`).toString();
        const duration = Number(durationResult)
        const totalMinutes = Math.floor(duration / (60))
        const hours = Math.floor(totalMinutes / (60))
        const minutes = Math.floor(totalMinutes % (60))

        let toParam = ""
        if (totalMinutes >= 1) {
            toParam = `--to "${formatTimestamp(hours, minutes)}"`
        }
        const nParam = `-n ${Math.max(totalMinutes, 1)}`
        const columnParam = '--columns 5'


        child_process.execSync(`${mtPath} ${toParam} ${nParam} ${columnParam} ${file}`)
    }
}

if (dir) {
    for (const file of getFiles(dir)) {
        if (path.extname(file) === ".mp4") {
            const fileStat = fs.statSync(file);
            const mtime = fileStat.mtime;
            const now = new Date();
            const diff = now.getTime() - mtime.getTime();
            if (diff > minAge && diff < maxAge) {
                processVideoMt(file);
            }
        }
    }
} else {
    console.error("no DIR")
}