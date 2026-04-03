import camelcase, { type Options } from "camelcase";

export function changeCase(input: string, options?: Options) {
    if (!options?.pascalCase) {
        return input.replace(/\./g, ""); // need to remove dots in the input string, otherwise, code generation fails
    }
    return camelcase(input, options);
}
