declare module "@flamesx_128/ees" {
  export interface IStore {
    module: string;
    data?: object;
  }


  /**
   * Create a new data logger.
   * @param {IStore} store - Store structure.
   * @returns {Promise<void>}
   */
  export function createStore(store: IStore): Promise<void>;


  /**
   * Convert ees syntax to html.
   * @param {string} filePath - Path of the file to render.
   * @param {boolean | undefined} isText - Indicates that it is a text and not a path.
   * @returns {Promise<string>}
   */
  export function render(filePath: string, isText?: boolean): Promise<string>;
}