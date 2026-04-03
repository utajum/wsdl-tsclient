import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "recursive2";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}.wsdl`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/recursive2/definitions/AccountElement.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/AccountElements.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/AddAttribute.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/AddAttributeRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/AddAttributeResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Attr.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Identifier.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Items.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Messages.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/OperationResponse.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/RequestItem.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/RequestItems.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Requests.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/Response.ts`)).toBe(true);
        expect(existsSync(`${outdir}/recursive2/definitions/ResponseItem.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/recursive2/index.ts`);
    });
});
