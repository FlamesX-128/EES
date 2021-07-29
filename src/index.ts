import { readFileSync } from "fs";

/** @typedef {import("@flamesx_128/ees").IStore} IStore */

export interface IStore {
  module: string;
  data?: object;
};


/** @type {Map<string, IStore>} */
const dataStore: Map<string, IStore> = new Map();


/**
 * Generate a new key.
 * @returns {Promise<string>}
 */
async function generateKey(): Promise<string> {
  /** @type {string} result */
  let result: string = "";

  /** @type {string} validChars */
  const validChars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",

    /** @type {number} charsLength */
    charsLength: number = validChars.length;


  for (let i = 0; i < 32; i++) {
    result += validChars.charAt(Math.floor(Math.random() * charsLength));
  };

  return result;
};


/**
 * Create a new data logger.
 * @param {IStore} store - Store structure.
 * @returns {Promise<void>}
 */
export async function createStore(store: IStore): Promise<void> {
  /** @type {string[]} */
  const stores: string[] = Array.from(dataStore.keys()),
    /** @type {string[]} */
    resStore: string[] = stores.filter(
      /**
       * 
       * @param {string} module
       * @returns {boolean}
       */
      (module: string): boolean => store.module === module
    );


  if (resStore.length) 
    return console.info(`The store ${store.module} is already declared.`);

  dataStore.set(store.module, store);
};


/**
 * Convert ees syntax to html.
 * @param {string} filePath - Path of the file to render.
 * @param {boolean | undefined} isText - Indicates that it is a text and not a path.
 * @returns {Promise<string>}
 */
export async function render(filePath: string, isText?: boolean): Promise<string> {
  /** @type {Map<string, string>} localCache */
  const localCache: Map<string, string> = new Map();

  /** @type {number} prevPos*/
  let prevPos: number = 0,

    /** @type {string} file */
    file: string = isText ? filePath : readFileSync(filePath, { encoding: "utf-8" }),

    /** @type {string} tempFile */
    tempFile: string = file;


  /**
   * Search for EES syntax.
   * @returns {Promise<void>}
   */
  const searchEES = async (): Promise<void> => {
    /** @type {number} openEES */
    const openEES: number = tempFile.indexOf("<(", 0),

      /** @type {number} closeEES */
      closeEES: number = tempFile.indexOf(")>", prevPos);

    /** @type {number} */
    let EESTarget: number = openEES;


    if (openEES > -1 && closeEES > -1) {
      while (true) {
        /** @type {number} otherEES */
        const otherEES: number = tempFile.indexOf("<(", prevPos);
        prevPos = otherEES + 2;

        if (otherEES > -1 && otherEES < closeEES) {
          EESTarget = otherEES;

          continue;
        };

        break;
      };

      /** @type {string} targetPos */
      const targetPos: string = tempFile.slice(EESTarget + 2, closeEES),

        /** @type {string} renderCode */
        renderCode: string = await generateKey();


      localCache.set(renderCode, targetPos);
      prevPos = 0;

      tempFile = tempFile.replace(tempFile.slice(EESTarget, closeEES + 2), renderCode);
      await searchEES();
    };
  };


  /**
   * Convert the content of the key to valid javascript.
   * @param value - Key of the content to convert.
   * @returns {Promise<string>}
   */
  const convertKey = async (value: string): Promise<string> => {
    /** @type {string[]} */
    const resultKeys: string[] = getkeys.filter(
      /**
       * Check if the value contains any keys.
       * @param {string} _key - Key of valid keys.
       * @returns {boolean}
       */
      (_key: string): boolean => value.includes(_key)
    );

    /** @type {string} resCode */
    let resCode: string = "";


    if (resultKeys.length) {
      for await (const key of resultKeys) {
        /** @type {string} code */
        let code: string = localCache.get(key)!.replace(/([<]+[(]|[)]+[>])/g, "");

        /** @type {RegExpMatchArray | null} */
        const resStr: RegExpMatchArray | null = code.match(/(?<=[{])(.*|\s){0,}(?=[}])/g);


        code = code.replace(resStr![0], `\ncache.push(\`${resStr![0]}\`);\n`);
        resCode = await processStr(code);
      };

      /** @type {string[]} resuKeys */
      const resuKeys: string[] = getkeys.filter(
        /**
         * Check if resCode contains any keys.
         * @param {string} _key_ - Key of valid keys.
         * @returns {boolean}
         */
        (_key_: string): boolean => resCode.includes(_key_)
      );

      for await (const key of resuKeys) {
        /** @type {string} code */
        const code: string = await convertKey(key);


        if (code !== resCode) resCode = resCode.replace(key, code);
      };

      return resCode;
    };

    return resCode;
  };


  /**
   * Convert the no code to "string".
   * @param value - Code to evaluate and / or convert to string.
   * @returns {Promise<string>}
   */
  const processStr = async (value: string): Promise<string> => {
    /** @type {string[]} resultKeys */
    const resultKeys: string[] = getkeys.filter(
      /**
       * Check if value contains any keys.
       * @param {string} key - Key of valid keys.
       * @returns {boolean}
       */
      (_key: string): boolean => value.includes(_key)
    );

    /** @type {string} tempCode*/
    let tempCode: string = value;


    for await (const key of resultKeys) {
      tempCode = tempCode.replace(key, `\`);\n${key}\ncache.push(\``);
    };

    return tempCode;
  };


  /**
   * 
   * @param {string} codeValue 
   * @returns {Promise<string>}
   */
  const processVars = async (codeValue: string): Promise<string> => {
    /** @type {RegExpExecArray | null} svalues*/
    const values: RegExpMatchArray | null = codeValue.match(/(?<=[<]+[{]).*(?=[}]+[>])/g);

    /** @type {string} tempCode */
    let tempCode: string = codeValue;


    if (values) for (const value of values) {
      /** @type {string | string[]} */
      const module: string | string[] = value.includes(":") ? value.split(":") : value;


      tempCode = tempCode.replace(
        /(?=[<]+[{]).*(?<=[}]+[>])/, `$\{dataStore.get("${value.includes(":") ? module[0] : "main"}").data.${value.includes(":") ? module[1] : value}\}`
      );
    };

    return tempCode;
  };


  /**
   * Execute javascript code.
   * @param code - Code to execute.
   * @returns {Promise<string>}
   */
  const executeJS = async (code: string): Promise<string> => {
    /** @type {Function} value*/
    const value: Function = new Function("dataStore", `console.log(dataStore); const cache = []; async function main() { ${code} }; (async () => await main())().catch((err) => console.log(\`\${err.name}: \${err.message}\`)); return cache;`);

    return await value(dataStore).join("");
  };


  // Search for EES syntax
  await searchEES();


  /** @type {string[]} */
  const getkeys: string[] = Array.from(localCache.keys()),

    /** @type {string[]} */
    reskeys: string[] = getkeys.filter(
      /**
       * Check if the file contains any keys.
       * @param {string} key - Key of valid keys.
       * @returns {boolean}
       */
      (key: string): boolean => tempFile.includes(key)
    );


  for await (const key of reskeys) {
    /** @type {string} result */
    const result: string = await convertKey(key),
    /** @type {string} newRes */
      newRes: string = await processVars(result);


    tempFile = tempFile.replace(key, await executeJS(newRes));
  };

  return tempFile;
};