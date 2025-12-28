/**
 * LLM Prompts for Auto-Branding
 * Used with OpenRouter API
 */

export const EXTRACT_COMPANY_DATA_PROMPT = `
Analyze this website HTML and extract company information.

Base URL: {{BASE_URL}}
Meta information: {{META}}

HTML content (truncated):
{{HTML}}

Extract:
1. Company name (check <title>, <h1>, meta tags, footer)
2. NIP / Tax ID (look for patterns like "NIP: 123-456-78-90" or "NIP 1234567890")
3. Address (street, city, postal code - usually in footer or contact section)
4. Phone number (look for tel: links or patterns like +48 123 456 789)
5. Email contact (look for mailto: links or patterns like contact@domain.pl)
6. Logo URL (check <img> with alt containing "logo", or header images)
7. Favicon URL (check <link rel="icon"> or <link rel="shortcut icon">)

Return ONLY valid JSON with this exact structure:
{
  "companyName": "Company Name",
  "nip": "123-456-78-90",
  "address": {
    "street": "ul. Przykladowa 10",
    "city": "Warszawa",
    "postalCode": "00-001"
  },
  "phone": "+48 123 456 789",
  "email": "kontakt@firma.pl",
  "logoUrl": "/path/to/logo.png",
  "faviconUrl": "/favicon.ico"
}

If a field cannot be found, use null for that field.
`;

export const EXTRACT_COLORS_PROMPT = `
Analyze this company logo image and extract the brand colors.

Extract:
1. Primary brand color (most dominant/important color in the logo)
2. Secondary color (second most prominent, or a complementary color if only one is present)
3. Accent color (tertiary color, or generate a harmonious complementary color)

Rules:
- All colors must be in HEX format (#RRGGBB)
- If logo has only 1 color, generate harmonious secondary and accent colors
- If logo is grayscale, generate a professional blue-based palette
- Avoid pure black (#000000) or pure white (#FFFFFF) as primary

Return ONLY valid JSON:
{
  "primary": "#RRGGBB",
  "secondary": "#RRGGBB",
  "accent": "#RRGGBB"
}
`;

/**
 * OpenRouter Models Configuration
 */
export const OPENROUTER_MODELS = {
  text: {
    primary: 'meta-llama/llama-3.2-3b-instruct:free',
    fallback: 'qwen/qwen-2-7b-instruct:free',
  },
  vision: {
    primary: 'google/gemini-2.0-flash-exp:free',
    fallback: 'meta-llama/llama-3.2-11b-vision-instruct:free',
  },
} as const;
