import * as path from "path";
import {
    AllElement,
    ChoiceElement,
    ComplexContentElement,
    ComplexTypeElement,
    DefinitionsElement,
    ElementElement,
    ExtensionElement,
    SequenceElement,
    SimpleContentElement,
    SimpleTypeElement,
} from "soap/lib/wsdl/elements";
import { splitQName } from "soap/lib/utils";
import { open_wsdl } from "soap/lib/wsdl/index";
import { Definition, Method, ParsedWsdl, Port, Service } from "./models/parsed-wsdl";
import { changeCase } from "./utils/change-case";
import { stripExtension } from "./utils/file";
import { reservedKeywords } from "./utils/javascript";
import { Logger } from "./utils/logger";

interface ParserOptions {
    modelNamePrefix: string;
    modelNameSuffix: string;
    maxRecursiveDefinitionName: number;
    caseInsensitiveNames: boolean;
    useWsdlTypeNames: boolean;
}

const defaultOptions: ParserOptions = {
    modelNamePrefix: "",
    modelNameSuffix: "",
    maxRecursiveDefinitionName: 64,
    caseInsensitiveNames: false,
    useWsdlTypeNames: false,
};

type VisitedDefinition = {
    name: string;
    parts: object;
    definition: Definition;
};

function findReferenceDefiniton(visited: Array<VisitedDefinition>, definitionParts: object) {
    return visited.find((def) => def.parts === definitionParts);
}

const NODE_SOAP_PARSED_TYPES: { [type: string]: string } = {
    int: "number",
    integer: "number",
    short: "number",
    long: "number",
    double: "number",
    float: "number",
    decimal: "number",
    bool: "boolean",
    boolean: "boolean",
    dateTime: "Date",
    date: "Date",
};

function toPrimitiveType(type: string): string {
    const index = type.indexOf(":");
    if (index >= 0) {
        type = type.substring(index + 1);
    }
    return NODE_SOAP_PARSED_TYPES[type] || "string";
}

type ElementSchema = ElementElement | ComplexTypeElement | SimpleTypeElement;

function findElementSchemaType(definitions: DefinitionsElement, element: ElementSchema) {
    if (!("$type" in element) && !("$ref" in element)) return element;
    const type = element.$type || element.$ref;
    if (!type) return element;
    const { prefix, name: localName } = splitQName(type);
    const ns =
        element.schemaXmlns[prefix] ?? definitions.xmlns?.[prefix] ?? definitions.xmlns?.[element.targetNSAlias!];
    const schema = definitions.schemas[ns];
    if (!schema) return element;
    const typeElement = schema.complexTypes[localName] ?? schema.types[localName];
    return typeElement;
}

function findPropSchemaType(
    definitions: DefinitionsElement,
    parentElement: ElementSchema | undefined,
    propName: string,
): ElementSchema | undefined {
    if (!parentElement?.children) return undefined;
    for (const child of parentElement.children) {
        if (
            child instanceof ComplexTypeElement ||
            child instanceof ChoiceElement ||
            child instanceof SequenceElement ||
            child instanceof AllElement ||
            child instanceof SimpleContentElement ||
            child instanceof ComplexContentElement ||
            child instanceof ExtensionElement
        ) {
            const result = findPropSchemaType(definitions, child, propName);
            if (result) return result;
            continue;
        }
        if (child.$name === propName) {
            if (
                child instanceof ElementElement ||
                child instanceof ComplexTypeElement ||
                child instanceof SimpleTypeElement
            ) {
                return findElementSchemaType(definitions, child);
            }
        }
    }
    return undefined;
}

function getNameFromSchema(element: ElementSchema | undefined) {
    if (!element) return undefined;
    if ("$type" in element || "$ref" in element) {
        const type = element.$type || element.$ref;
        const { name: localName } = splitQName(type);
        return localName;
    }
    return element.$name;
}

/**
 * Fallback schema lookup: find a ComplexTypeElement by name in the schema registry.
 * Used when findPropSchemaType returns undefined (e.g. WCF generic types where
 * the schema tree doesn't match the node-soap resolved defParts).
 * Searches by targetNamespace first (from defParts context), then all schemas.
 */
function findTypeInSchemas(
    definitions: DefinitionsElement,
    typeName: string,
    targetNamespace?: string,
): ComplexTypeElement | undefined {
    // Prefer the namespace from defParts context
    if (targetNamespace) {
        const schema = definitions.schemas[targetNamespace];
        if (schema) {
            const ct = schema.complexTypes[typeName] ?? schema.types[typeName];
            if (ct instanceof ComplexTypeElement) return ct;
        }
    }
    // Fallback: search all schemas
    for (const schema of Object.values(definitions.schemas)) {
        const ct = schema.complexTypes?.[typeName] ?? schema.types?.[typeName];
        if (ct instanceof ComplexTypeElement) return ct;
    }
    return undefined;
}

/**
 * Resolve xs:extension base="..." to the base ComplexTypeElement.
 * Walks schema children for ComplexContentElement -> ExtensionElement,
 * then resolves the $base QName to a ComplexTypeElement in the schema registry.
 */
function findExtensionBase(
    definitions: DefinitionsElement,
    schema: ElementSchema | undefined,
): ComplexTypeElement | undefined {
    if (!schema?.children) return undefined;
    for (const child of schema.children) {
        if (child instanceof ComplexContentElement) {
            for (const ext of child.children) {
                if (ext instanceof ExtensionElement && ext.$base) {
                    const { prefix, name: localName } = splitQName(ext.$base);
                    const ns = ext.schemaXmlns[prefix] ?? ext.xmlns?.[prefix] ?? definitions.xmlns?.[prefix];
                    if (!ns) return undefined;
                    const baseSchema = definitions.schemas[ns];
                    if (!baseSchema) return undefined;
                    const baseType = baseSchema.complexTypes[localName] ?? baseSchema.types[localName];
                    if (baseType instanceof ComplexTypeElement) return baseType;
                    return undefined;
                }
            }
        }
    }
    return undefined;
}

/**
 * Collect ElementElement entries from a type's immediate Sequence/All/Choice children.
 * Does NOT descend into ComplexContent/Extension (those are for inheritance).
 */
function collectDirectElements(schema: ComplexTypeElement): ElementElement[] {
    const elements: ElementElement[] = [];
    function walk(children: any[] | undefined) {
        if (!children) return;
        for (const child of children) {
            if (child instanceof ElementElement) {
                elements.push(child);
            } else if (
                child instanceof SequenceElement ||
                child instanceof AllElement ||
                child instanceof ChoiceElement
            ) {
                walk(child.children);
            }
            // Skip ComplexContentElement, SimpleContentElement, ExtensionElement
        }
    }
    walk(schema.children);
    return elements;
}

/**
 * Check if an ElementElement's $type is an XSD built-in primitive
 * (i.e. its namespace is http://www.w3.org/2001/XMLSchema).
 */
function isPrimitiveXsdType(element: ElementElement, definitions: DefinitionsElement): boolean {
    const type = element.$type;
    if (!type) return false;
    const { prefix } = splitQName(type);
    const ns = element.schemaXmlns[prefix] ?? element.xmlns?.[prefix] ?? definitions.xmlns?.[prefix];
    return ns === "http://www.w3.org/2001/XMLSchema";
}

/**
 * Recursively walk the xs:extension inheritance chain and add inherited
 * properties to the definition. Processes grandparent before parent so
 * properties appear in correct inheritance order.
 */
function addInheritedProperties(
    definition: Definition,
    parsedWsdl: ParsedWsdl,
    options: ParserOptions,
    definitions: DefinitionsElement,
    baseType: ComplexTypeElement,
    stack: string[],
    visitedDefs: Array<VisitedDefinition>,
    defParts: { [propNameType: string]: any },
    seen: Set<string>,
): void {
    // Circular inheritance guard
    const baseId = baseType.$name ?? "";
    if (seen.has(baseId)) return;
    seen.add(baseId);

    // Process grandparent first (multi-level inheritance)
    const grandparent = findExtensionBase(definitions, baseType);
    if (grandparent) {
        addInheritedProperties(
            definition,
            parsedWsdl,
            options,
            definitions,
            grandparent,
            stack,
            visitedDefs,
            defParts,
            seen,
        );
    }

    // Collect direct elements from this base type
    const baseElements = collectDirectElements(baseType);
    for (const elem of baseElements) {
        const propName = elem.$name;
        if (!propName) continue;

        // Skip if child type already defines this property (child overrides parent)
        if (propName in defParts || `${propName}[]` in defParts) continue;
        // Skip if already added from a higher ancestor
        if (definition.properties.some((p) => p.name === propName)) continue;

        const isArray = elem.$maxOccurs === "unbounded";

        if (isPrimitiveXsdType(elem, definitions)) {
            definition.properties.push({
                kind: "PRIMITIVE",
                name: propName,
                sourceName: propName,
                description: elem.$type || "string",
                type: toPrimitiveType(elem.$type || "string"),
                isArray,
            });
        } else {
            // Complex type - resolve schema element and recurse
            const resolvedSchema = findElementSchemaType(definitions, elem);
            if (resolvedSchema) {
                const subDefinition = parseDefinition(
                    parsedWsdl,
                    options,
                    getNameFromSchema(resolvedSchema) ?? propName,
                    {},
                    [...stack, propName],
                    visitedDefs,
                    definitions,
                    resolvedSchema,
                );
                definition.properties.push({
                    kind: "REFERENCE",
                    name: propName,
                    sourceName: propName,
                    ref: subDefinition,
                    isArray,
                });
            } else {
                // Fallback: treat as string primitive
                definition.properties.push({
                    kind: "PRIMITIVE",
                    name: propName,
                    sourceName: propName,
                    description: elem.$type || "string",
                    type: "string",
                    isArray,
                });
            }
        }
    }
}

/**
 * parse definition
 * @param parsedWsdl context of parsed wsdl
 * @param name name of definition, will be used as name of interface
 * @param defParts definition's parts - its properties
 * @param stack definitions stack of path to current subdefinition (immutable)
 * @param visitedDefs set of globally visited definitions to avoid circular definitions
 */
function parseDefinition(
    parsedWsdl: ParsedWsdl,
    options: ParserOptions,
    name: string,
    defParts: { [propNameType: string]: any },
    stack: string[],
    visitedDefs: Array<VisitedDefinition>,
    definitions: DefinitionsElement,
    schema: ElementSchema | undefined,
): Definition {
    const defName = changeCase(name, { pascalCase: true });

    Logger.debug(`Parsing Definition ${stack.join(".")}.${name}`);

    let nonCollisionDefName: string;
    try {
        nonCollisionDefName = parsedWsdl.findNonCollisionDefinitionName(defName);
    } catch (err) {
        const e = new Error(`Error for finding non-collision definition name for ${stack.join(".")}.${name}`);
        throw e;
    }
    const definition: Definition = {
        name: `${options.modelNamePrefix}${changeCase(nonCollisionDefName, { pascalCase: true })}${
            options.modelNameSuffix
        }`,
        sourceName: name,
        docs: [name],
        properties: [],
        description: "",
    };

    parsedWsdl.definitions.push(definition); // Must be here to avoid name collision with `findNonCollisionDefinitionName` if sub-definition has same name
    visitedDefs.push({ name: definition.name, parts: defParts, definition }); // NOTE: cache reference to this defintion globally (for avoiding circular references)
    if (defParts) {
        // NOTE: `node-soap` has sometimes problem with parsing wsdl files, it includes `defParts.undefined = undefined`
        if ("undefined" in defParts && defParts.undefined === undefined) {
            // TODO: problem while parsing WSDL, maybe report to node-soap
            // TODO: add flag --FailOnWsdlError
            Logger.error(
                `Problem while generating a definition file at ${stack.join(".")}: ${JSON.stringify(defParts)}`,
            );
        } else {
            // Resolve inherited properties from xs:extension base type.
            // node-soap only flattens base properties into top-level message parts;
            // for nested types used as sub-properties, defParts is missing inherited fields.
            const baseType = findExtensionBase(definitions, schema);
            if (baseType) {
                addInheritedProperties(
                    definition,
                    parsedWsdl,
                    options,
                    definitions,
                    baseType,
                    stack,
                    visitedDefs,
                    defParts,
                    new Set(),
                );
            }
            Object.entries(defParts).forEach(([propName, type]) => {
                if (propName === "targetNSAlias") {
                    definition.docs.push(`@targetNSAlias \`${type}\``);
                } else if (propName === "targetNamespace") {
                    definition.docs.push(`@targetNamespace \`${type}\``);
                } else if (propName.endsWith("[]")) {
                    const stripedPropName = propName.substring(0, propName.length - 2);
                    // Array of
                    if (typeof type === "string") {
                        // primitive type
                        definition.properties.push({
                            kind: "PRIMITIVE",
                            name: stripedPropName,
                            sourceName: propName,
                            description: type,
                            type: toPrimitiveType(type),
                            isArray: true,
                        });
                    } else if (type instanceof ComplexTypeElement) {
                        // TODO: Finish complex type parsing by updating node-soap
                        definition.properties.push({
                            kind: "PRIMITIVE",
                            name: stripedPropName,
                            sourceName: propName,
                            description: "ComplexType are not supported yet",
                            type: "any",
                            isArray: true,
                        });
                        Logger.warn(`Cannot parse ComplexType '${stack.join(".")}.${name}' - using 'any' type`);
                    } else {
                        // With sub-type
                        const visited = findReferenceDefiniton(visitedDefs, type);
                        if (visited) {
                            // By referencing already declared definition, we will avoid circular references
                            definition.properties.push({
                                kind: "REFERENCE",
                                name: stripedPropName,
                                sourceName: propName,
                                ref: visited.definition,
                                isArray: true,
                            });
                        } else {
                            try {
                                const propSchema =
                                    findPropSchemaType(definitions, schema, stripedPropName) ??
                                    findTypeInSchemas(definitions, stripedPropName, type?.targetNamespace);
                                const guessPropName =
                                    (options.useWsdlTypeNames && getNameFromSchema(propSchema)) || stripedPropName;
                                const subDefinition = parseDefinition(
                                    parsedWsdl,
                                    options,
                                    guessPropName,
                                    type,
                                    [...stack, propName],
                                    visitedDefs,
                                    definitions,
                                    propSchema,
                                );
                                definition.properties.push({
                                    kind: "REFERENCE",
                                    name: stripedPropName,
                                    sourceName: propName,
                                    ref: subDefinition,
                                    isArray: true,
                                });
                            } catch (err) {
                                const e = new Error(
                                    `Error while parsing Subdefinition for '${stack.join(".")}.${name}'`,
                                );
                                throw e;
                            }
                        }
                    }
                } else if (typeof type === "string") {
                    // primitive type
                    definition.properties.push({
                        kind: "PRIMITIVE",
                        name: propName,
                        sourceName: propName,
                        description: type,
                        type: toPrimitiveType(type),
                        isArray: false,
                    });
                } else if (type instanceof ComplexTypeElement) {
                    // TODO: Finish complex type parsing by updating node-soap
                    definition.properties.push({
                        kind: "PRIMITIVE",
                        name: propName,
                        sourceName: propName,
                        description: "ComplexType are not supported yet",
                        type: "any",
                        isArray: false,
                    });
                    Logger.warn(`Cannot parse ComplexType '${stack.join(".")}.${name}' - using 'any' type`);
                } else {
                    // With sub-type
                    const reference = findReferenceDefiniton(visitedDefs, type);
                    if (reference) {
                        // By referencing already declared definition, we will avoid circular references
                        definition.properties.push({
                            kind: "REFERENCE",
                            name: propName,
                            sourceName: propName,
                            description: "",
                            ref: reference.definition,
                            isArray: false,
                        });
                    } else {
                        try {
                            const propSchema =
                                findPropSchemaType(definitions, schema, propName) ??
                                findTypeInSchemas(definitions, propName, type?.targetNamespace);
                            const guessPropName =
                                (options.useWsdlTypeNames && getNameFromSchema(propSchema)) || propName;
                            const subDefinition = parseDefinition(
                                parsedWsdl,
                                options,
                                guessPropName,
                                type,
                                [...stack, propName],
                                visitedDefs,
                                definitions,
                                propSchema,
                            );
                            definition.properties.push({
                                kind: "REFERENCE",
                                name: propName,
                                sourceName: propName,
                                ref: subDefinition,
                                isArray: false,
                            });
                        } catch (err) {
                            const e = new Error(`Error while parsing Subdefinition for ${stack.join(".")}.${name}`);
                            throw e;
                        }
                    }
                }
            });
        }
    } else {
        // Empty
    }

    return definition;
}

// TODO: Add logs
// TODO: Add comments for services, ports, methods and client
/**
 * Parse WSDL to domain model `ParsedWsdl`
 * @param wsdlPath - path or url to wsdl file
 */
export async function parseWsdl(wsdlPath: string, options: Partial<ParserOptions>): Promise<ParsedWsdl> {
    const mergedOptions: ParserOptions = {
        ...defaultOptions,
        ...options,
    };
    return new Promise((resolve, reject) => {
        open_wsdl(
            wsdlPath,
            { namespaceArrayElements: false, ignoredNamespaces: ["tns", "targetNamespace", "typeNamespace"] },
            function (err, wsdl) {
                if (err) {
                    return reject(err);
                }
                if (wsdl === undefined) {
                    return reject(new Error("WSDL is undefined"));
                }

                const parsedWsdl = new ParsedWsdl({
                    maxStack: options.maxRecursiveDefinitionName,
                    caseInsensitiveNames: options.caseInsensitiveNames,
                    modelNamePrefix: options.modelNamePrefix,
                    modelNameSuffix: options.modelNameSuffix,
                });
                const filename = path.basename(wsdlPath);
                parsedWsdl.name = changeCase(stripExtension(filename), {
                    pascalCase: true,
                });
                parsedWsdl.wsdlFilename = path.basename(filename);
                parsedWsdl.wsdlPath = path.resolve(wsdlPath);

                const visitedDefinitions: Array<VisitedDefinition> = [];

                const allPorts: Port[] = [];
                const services: Service[] = [];
                for (const [serviceName, service] of Object.entries(wsdl.definitions.services)) {
                    Logger.debug(`Parsing Service ${serviceName}`);
                    const servicePorts: Port[] = []; // TODO: Convert to Array

                    for (const [portName, port] of Object.entries(service.ports)) {
                        Logger.debug(`Parsing Port ${portName}`);
                        const portMethods: Method[] = [];

                        for (const [methodName, method] of Object.entries(port.binding.methods)) {
                            Logger.debug(`Parsing Method ${methodName}`);

                            // TODO: Deduplicate code below by refactoring it to external function. Is it even possible ?
                            let requestParamName = "request";
                            let inputDefinition: Definition | null = null; // default type
                            if (method.input) {
                                if (method.input.$name) {
                                    requestParamName = method.input.$name;
                                }
                                const inputMessage = wsdl.definitions.messages[method.input.$name!];
                                if (inputMessage.element) {
                                    // TODO: if `$type` not defined, inline type into function declartion (do not create definition file) - wsimport
                                    const typeName = (inputMessage.element.$type ?? inputMessage.element.$name)!;
                                    const type = parsedWsdl.findDefinition(typeName);
                                    const schema = findElementSchemaType(wsdl.definitions, inputMessage.element);
                                    inputDefinition =
                                        type ??
                                        parseDefinition(
                                            parsedWsdl,
                                            mergedOptions,
                                            typeName,
                                            inputMessage.parts,
                                            [typeName],
                                            visitedDefinitions,
                                            wsdl.definitions,
                                            schema,
                                        );
                                } else if (inputMessage.parts) {
                                    const type = parsedWsdl.findDefinition(requestParamName);
                                    inputDefinition =
                                        type ??
                                        parseDefinition(
                                            parsedWsdl,
                                            mergedOptions,
                                            requestParamName,
                                            inputMessage.parts,
                                            [requestParamName],
                                            visitedDefinitions,
                                            wsdl.definitions,
                                            undefined,
                                        );
                                } else {
                                    Logger.debug(
                                        `Method '${serviceName}.${portName}.${methodName}' doesn't have any input defined`,
                                    );
                                }
                            }

                            let responseParamName = "response";
                            let outputDefinition: Definition | null = null; // default type, `{}` or `unknown` ?
                            if (method.output) {
                                if (method.output.$name) {
                                    responseParamName = method.output.$name;
                                }
                                const outputMessage = wsdl.definitions.messages[method.output.$name!];
                                if (outputMessage.element) {
                                    // TODO: if `$type` not defined, inline type into function declartion (do not create definition file) - wsimport
                                    const typeName = (outputMessage.element.$type ?? outputMessage.element.$name)!;
                                    const type = parsedWsdl.findDefinition(typeName);
                                    const schema = findElementSchemaType(wsdl.definitions, outputMessage.element);
                                    outputDefinition =
                                        type ??
                                        parseDefinition(
                                            parsedWsdl,
                                            mergedOptions,
                                            typeName,
                                            outputMessage.parts,
                                            [typeName],
                                            visitedDefinitions,
                                            wsdl.definitions,
                                            schema,
                                        );
                                } else {
                                    const type = parsedWsdl.findDefinition(responseParamName);
                                    outputDefinition =
                                        type ??
                                        parseDefinition(
                                            parsedWsdl,
                                            mergedOptions,
                                            responseParamName,
                                            outputMessage.parts,
                                            [responseParamName],
                                            visitedDefinitions,
                                            wsdl.definitions,
                                            undefined,
                                        );
                                }
                            }

                            const camelParamName = changeCase(requestParamName);
                            const portMethod: Method = {
                                name: methodName,
                                paramName: reservedKeywords.includes(camelParamName)
                                    ? `${camelParamName}Param`
                                    : camelParamName,
                                paramDefinition: inputDefinition, // TODO: Use string from generated definition files
                                returnDefinition: outputDefinition, // TODO: Use string from generated definition files
                            };
                            portMethods.push(portMethod);
                        }

                        const servicePort: Port = {
                            name: changeCase(portName, { pascalCase: true }),
                            sourceName: portName,
                            methods: portMethods,
                        };
                        servicePorts.push(servicePort);
                        allPorts.push(servicePort);
                    } // End of Port cycle

                    services.push({
                        name: changeCase(serviceName, { pascalCase: true }),
                        sourceName: serviceName,
                        ports: servicePorts,
                    });
                } // End of Service cycle

                parsedWsdl.services = services;
                parsedWsdl.ports = allPorts;

                return resolve(parsedWsdl);
            },
        );
    });
}
