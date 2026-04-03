import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "array_namespace_override.wsdl";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}`;
    const outdir = "./test/generated";

    it(`${target} - generate wsdl client`, async () => {
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/Items.ts`)).toBe(true);
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/Markdowns.ts`)).toBe(true);
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/Order.ts`)).toBe(true);
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/OrderDetails.ts`)).toBe(true);
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/TnscreateOrderResponseVo.ts`)).toBe(true);
        expect(existsSync(`${outdir}/arraynamespaceoverride/definitions/TnscreateWebOrderRequest.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/arraynamespaceoverride/index.ts`);
    });
});
