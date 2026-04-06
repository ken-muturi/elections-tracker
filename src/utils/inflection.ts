// Types
type InflectionRule = [RegExp, string];
type IrregularForms = Record<string, string>;

// Irregular forms that don't follow standard rules
const irregularSingulars: IrregularForms = {
    'children': 'child',
    'feet': 'foot',
    'geese': 'goose',
    'men': 'man',
    'mice': 'mouse',
    'people': 'person',
    'teeth': 'tooth',
    'women': 'woman'
};

const irregularPlurals: IrregularForms = {
    'child': 'children',
    'foot': 'feet',
    'goose': 'geese',
    'man': 'men',
    'mouse': 'mice',
    'person': 'people',
    'tooth': 'teeth',
    'woman': 'women'
};

// Rules for pluralization
const pluralRules: InflectionRule[] = [
    [/(quiz)$/i, '$1zes'],
    [/^(ox)$/i, '$1en'],
    [/([m|l])ouse$/i, '$1ice'],
    [/(matr|vert|ind)ix|ex$/i, '$1ices'],
    [/(x|ch|ss|sh)$/i, '$1es'],
    [/([^aeiouy]|qu)y$/i, '$1ies'],
    [/(hive)$/i, '$1s'],
    [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
    [/sis$/i, 'ses'],
    [/([ti])um$/i, '$1a'],
    [/(buffal|tomat)o$/i, '$1oes'],
    [/(bu)s$/i, '$1ses'],
    [/(alias|status)$/i, '$1es'],
    [/(octop|vir)us$/i, '$1i'],
    [/(ax|test)is$/i, '$1es'],
    [/s$/i, 's'],
    [/$/, 's']
];

// Rules for singularization
const singularRules: InflectionRule[] = [
    [/(quiz)zes$/i, '$1'],
    [/(matr)ices$/i, '$1ix'],
    [/(vert|ind)ices$/i, '$1ex'],
    [/^(ox)en$/i, '$1'],
    [/(alias|status)es$/i, '$1'],
    [/(octop|vir)i$/i, '$1us'],
    [/(cris|ax|test)es$/i, '$1is'],
    [/(shoe)s$/i, '$1'],
    [/(o)es$/i, '$1'],
    [/(bus)es$/i, '$1'],
    [/([m|l])ice$/i, '$1ouse'],
    [/(x|ch|ss|sh)es$/i, '$1'],
    [/(m)ovies$/i, '$1ovie'],
    [/(s)eries$/i, '$1eries'],
    [/([^aeiouy]|qu)ies$/i, '$1y'],
    [/([lr])ves$/i, '$1f'],
    [/(tive)s$/i, '$1'],
    [/(hive)s$/i, '$1'],
    [/([^f])ves$/i, '$1fe'],
    [/(^analy)ses$/i, '$1sis'],
    [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1$2sis'],
    [/([ti])a$/i, '$1um'],
    [/(n)ews$/i, '$1ews'],
    [/s$/i, '']
];

/**
 * Converts a word to its singular form
 * @param word - The word to singularize
 * @returns The singular form of the word
 */
export const singularize = (word: string): string => {
    // Check for irregular forms first
    const irregularForm = irregularSingulars[word.toLowerCase()];
    if (irregularForm) {
        return irregularForm;
    }

    // Apply singularization rules
    for (const [rule, replacement] of singularRules) {
        if (rule.test(word)) {
            return word.replace(rule, replacement);
        }
    }

    return word;
};

/**
 * Converts a word to its plural form
 * @param word - The word to pluralize
 * @returns The plural form of the word
 */
export const pluralize = (word: string): string => {
    // Check for irregular forms first
    const irregularForm = irregularPlurals[word.toLowerCase()];
    if (irregularForm) {
        return irregularForm;
    }

    // Apply pluralization rules
    for (const [rule, replacement] of pluralRules) {
        if (rule.test(word)) {
            return word.replace(rule, replacement);
        }
    }

    return word;
};

/**
 * Returns the plural form if count is not 1, singular form otherwise
 * @param word - The word to pluralize or singularize
 * @param count - The count to determine which form to use
 * @returns The appropriate form of the word based on count
 */
export const pluralizeByCount = (word: string, count: number): string => {
    return count === 1 ? singularize(word) : pluralize(word);
};