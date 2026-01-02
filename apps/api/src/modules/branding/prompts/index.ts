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
2. Slogan/Tagline (check meta description, hero section, <p> near company name)
3. Company description (short description from meta tags or about section)
4. NIP / Tax ID (look for patterns like "NIP: 123-456-78-90" or "NIP 1234567890")
5. Address (street, city, postal code - usually in footer or contact section)
6. Phone number (look for tel: links or patterns like +48 123 456 789)
7. Email contact (look for mailto: links or patterns like contact@domain.pl)
8. Website URL (use the base URL provided)
9. Social media links (Facebook, LinkedIn, Instagram, Twitter, YouTube - check footer, header, social icons)
10. Logo URL (check <img> with alt containing "logo", or header images)
11. Favicon URL (check <link rel="icon"> or <link rel="shortcut icon">)

Return ONLY valid JSON with this exact structure:
{
  "companyName": "Company Name",
  "slogan": "Company tagline or slogan",
  "description": "Brief company description (1-2 sentences max)",
  "nip": "123-456-78-90",
  "address": {
    "street": "ul. Przykladowa 10",
    "city": "Warszawa",
    "postalCode": "00-001"
  },
  "phone": "+48 123 456 789",
  "email": "kontakt@firma.pl",
  "website": "https://example.com",
  "socialMedia": {
    "facebook": "https://facebook.com/companypage",
    "linkedin": "https://linkedin.com/company/companyname",
    "instagram": "https://instagram.com/companyname",
    "twitter": "https://twitter.com/companyname",
    "youtube": "https://youtube.com/@companyname"
  },
  "logoUrl": "/path/to/logo.png",
  "faviconUrl": "/favicon.ico"
}

If a field cannot be found, use null for that field. For socialMedia, omit platforms that are not found.
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
