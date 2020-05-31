/**
 * Tests whether the given variable is a real object and not an Array
 * @param it The variable to test
 */
export declare function isObject(it: any): it is object;
/**
 * Tests whether the given variable is really an Array
 * @param it The variable to test
 */
export declare function isArray(it: any): it is any[];
/**
 * Translates text to the target language. Automatically chooses the right translation API.
 * @param text The text to translate
 * @param targetLang The target language
 * @param yandexApiKey The yandex API key. You can create one for free at https://translate.yandex.com/developers
 */
export declare function translateText(text: string, targetLang: string, yandexApiKey?: string): Promise<string>;
/**
 * Translates text using the Google Translate API
 * @param text The text to translate
 * @param targetLang The target language
 */
export declare function translateGoogle(text: string, targetLang: string): Promise<string>;
