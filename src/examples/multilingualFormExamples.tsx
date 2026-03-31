// Example usage patterns for the generic useMultilingualForm hook

import { useMultilingualForm } from '@/hooks/useMultilingualForm';
import { TranslationText } from '@/types';
import { SupportedLocale } from '@/context/UXContext';

// Example 1: Product Form with multiple translation fields
interface ProductForm {
  id?: string;
  name: TranslationText[];
  description: TranslationText[];
  shortDescription: TranslationText[];
  features: TranslationText[];
  specifications: TranslationText[];
  price: number;
  category: string;
}

// Usage pattern for product form
const useProductFormTranslations = (languages: SupportedLocale[]) => {
  const translationFields: (keyof Pick<ProductForm, 'name' | 'description' | 'shortDescription' | 'features' | 'specifications'>)[] = [
    'name', 
    'description', 
    'shortDescription', 
    'features', 
    'specifications'
  ];
  
  return useMultilingualForm<Pick<ProductForm, 'name' | 'description' | 'shortDescription' | 'features' | 'specifications'>>(
    'en', 
    languages, 
    translationFields
  );
};

// Example 2: Article/Blog Form
interface ArticleForm {
  id?: string;
  title: TranslationText[];
  content: TranslationText[];
  excerpt: TranslationText[];
  metaTitle: TranslationText[];
  metaDescription: TranslationText[];
  tags: TranslationText[];
  publishDate: string;
  author: string;
}

const useArticleFormTranslations = (languages: SupportedLocale[]) => {
  const translationFields: (keyof Pick<ArticleForm, 'title' | 'content' | 'excerpt' | 'metaTitle' | 'metaDescription' | 'tags'>)[] = [
    'title', 
    'content', 
    'excerpt', 
    'metaTitle', 
    'metaDescription', 
    'tags'
  ];
  
  return useMultilingualForm<Pick<ArticleForm, 'title' | 'content' | 'excerpt' | 'metaTitle' | 'metaDescription' | 'tags'>>(
    'en', 
    languages, 
    translationFields
  );
};

// Example 3: Course/Training Form
interface CourseForm {
  id?: string;
  title: TranslationText[];
  description: TranslationText[];
  objectives: TranslationText[];
  prerequisites: TranslationText[];
  curriculum: TranslationText[];
  instructorNotes: TranslationText[];
  duration: number;
  level: string;
}

const useCourseFormTranslations = (languages: SupportedLocale[]) => {
  const translationFields: (keyof Pick<CourseForm, 'title' | 'description' | 'objectives' | 'prerequisites' | 'curriculum' | 'instructorNotes'>)[] = [
    'title', 
    'description', 
    'objectives', 
    'prerequisites', 
    'curriculum', 
    'instructorNotes'
  ];
  
  return useMultilingualForm<Pick<CourseForm, 'title' | 'description' | 'objectives' | 'prerequisites' | 'curriculum' | 'instructorNotes'>>(
    'en', 
    languages, 
    translationFields
  );
};

// Example 4: Menu/Restaurant Form
interface MenuItemForm {
  id?: string;
  itemName: TranslationText[];
  itemDescription: TranslationText[];
  ingredients: TranslationText[];
  allergyInfo: TranslationText[];
  price: number;
  category: string;
  isVegan: boolean;
}

const useMenuFormTranslations = (languages: SupportedLocale[]) => {
  const translationFields: (keyof Pick<MenuItemForm, 'itemName' | 'itemDescription' | 'ingredients' | 'allergyInfo'>)[] = [
    'itemName', 
    'itemDescription', 
    'ingredients', 
    'allergyInfo'
  ];
  
  return useMultilingualForm<Pick<MenuItemForm, 'itemName' | 'itemDescription' | 'ingredients' | 'allergyInfo'>>(
    'en', 
    languages, 
    translationFields
  );
};

// Example 5: Simple form with just label and value
interface SimpleForm {
  id?: string;
  label: TranslationText[];
  value: TranslationText[];
  category: string;
}

const useSimpleFormTranslations = (languages: SupportedLocale[]) => {
  const translationFields: (keyof Pick<SimpleForm, 'label' | 'value'>)[] = ['label', 'value'];
  
  return useMultilingualForm<Pick<SimpleForm, 'label' | 'value'>>(
    'en', 
    languages, 
    translationFields
  );
};

/*
Key benefits of this approach:

1. **Flexible Fields**: You can specify any field names (title, label, value, description, content, etc.)

2. **Type Safety**: Full TypeScript support with proper type checking

3. **Reusable**: Same hook works for any form structure

4. **Clean API**: Simple function calls for common operations:
   - getCurrentText(field, values) - get current language text
   - updateTranslation(field, text, values, setFieldValue) - update current language
   - addLanguage(lang, values, setFieldValue) - add new language
   - getActiveLanguages(values) - get all languages with content
   - hasAnyContent(lang, values) - check if language has any content

5. **Progress Tracking**: Built-in completion status tracking

Usage in component:
```tsx
const MyForm = () => {
  const languages = ['en', 'es', 'fr'];
  const { getCurrentText, updateTranslation, ... } = useProductFormTranslations(languages);
  
  return (
    <Formik initialValues={...}>
      {({ values, setFieldValue }) => (
        <Input 
          value={getCurrentText('name', values)}
          onChange={(e) => updateTranslation('name', e.target.value, values, setFieldValue)}
        />
      )}
    </Formik>
  );
};
```
*/
