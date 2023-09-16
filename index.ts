import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';

const dir = process.env.DIR;

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

const processVideo = (file: string) => {
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

if (dir) {
    for (const file of getFiles(dir)) {
        if (path.extname(file) === ".mp4") {
            const fileStat = fs.statSync(file);
            const mtime = fileStat.mtime;
            const now = new Date();
            const diff = now.getTime() - mtime.getTime();
            if (diff > 1000 * 60 * 10 && diff < 1000 * 60 * 60 * 24) {
                processVideo(file);
            }
        }
    }
} else {
    console.error("no DIR")
}