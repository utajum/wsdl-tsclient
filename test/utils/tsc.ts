import { promisify } from "util";
import { exec as execCb } from "child_process";

const exec = promisify(execCb);

export async function typecheck(pathToIndex: string) {
    await exec(`tsc ${pathToIndex} --noEmit --ignoreConfig --types node --skipLibCheck`, {
        env: process.env,
    });
}
