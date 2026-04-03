import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "hello_service";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    const expectedFiles = [
        "client.ts",
        "index.ts",
        "definitions/SayHelloRequest.ts",
        "definitions/SayHelloResponse.ts",
        "ports/HelloPort.ts",
        "services/HelloService.ts",
    ];

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    expectedFiles.forEach((file) => {
        it(`${target} - ${file} exists`, async () => {
            expect(existsSync(`${outdir}/helloservice/${file}`)).toBe(true);
        });
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/helloservice/index.ts`);
    });
});
