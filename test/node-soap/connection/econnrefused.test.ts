import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../../src";
import { Logger } from "../../../src/utils/logger";
import { typecheck } from "../../utils/tsc";

const target = "connection/econnrefused";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated/connection";

    it(`${target} - generate wsdl client`, async () => {
        try {
            await parseAndGenerate(input, outdir);
            expect.fail("Should throw error ECONNREFUSED 127.0.0.1:1");
        } catch (err) {
            expect(err).toBeTruthy();
        }
    });
});
