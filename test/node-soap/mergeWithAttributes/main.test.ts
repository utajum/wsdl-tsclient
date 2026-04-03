import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../../src";
import { Logger } from "../../../src/utils/logger";
import { typecheck } from "../../utils/tsc";

const target = "mergeWithAttributes/main";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated/mergeWithAttributes";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/main/definitions/AskPeat.ts`)).toBe(true);
        expect(existsSync(`${outdir}/main/definitions/AskPeatResponse.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/main/index.ts`);
    });
});
