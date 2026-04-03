import { describe, it, expect } from "vitest";
import { existsSync, rmSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

const target = "jaxws_generated_service";

describe(target, () => {
    Logger.disabled();

    const input = `./test/resources/${target}/TestService.wsdl`;
    const outdir = "./test/generated/jaxws_generated_service";

    it(`${target} - generate wsdl client with default options`, async () => {
        rmSync(outdir, { recursive: true, force: true });
        await parseAndGenerate(input, outdir);
    });

    it(`${target} - check definitions`, async () => {
        expect(existsSync(`${outdir}/testservice/definitions/Request.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/Request1.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/Return.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/TnsaddNumber.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/TnsaddNumberResponse.ts`)).toBe(true);
    });

    it(`${target} - compile`, async () => {
        await typecheck(`${outdir}/testservice/index.ts`);
    });

    it(`${target} - generate wsdl client with useWsdlTypeNames`, async () => {
        rmSync(outdir, { recursive: true, force: true });
        await parseAndGenerate(input, outdir, { useWsdlTypeNames: true });
    });

    it(`${target} - check useWsdlTypeNames definitions`, async () => {
        expect(existsSync(`${outdir}/testservice/definitions/ComplextRecursiveResult.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/ComplextRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/SimpleRequest.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/TnsaddNumber.ts`)).toBe(true);
        expect(existsSync(`${outdir}/testservice/definitions/TnsaddNumberResponse.ts`)).toBe(true);
    });

    it(`${target} - compile useWsdlTypeNames`, async () => {
        await typecheck(`${outdir}/testservice/index.ts`);
    });
});
