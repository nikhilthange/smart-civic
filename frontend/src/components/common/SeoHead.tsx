import React, { useEffect } from "react";

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  faqs?: SeoFaqItem[];
  schemaOverride?: Record<string, any>;
}

const DEFAULT_TITLE = "Smart Civic AI - BMC Mumbai Grievance & CityOS Portal";
const DEFAULT_DESC = "Report Mumbai potholes, garbage, and civic defects with instant AI verification, guaranteed 48-hour SLA resolution, and live 24-ward tracking.";
const DEFAULT_IMAGE = "https://smart-civic-pi.vercel.app/og-preview.png";
const BASE_URL = "https://smart-civic-pi.vercel.app";

export const SeoHead: React.FC<SeoHeadProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords,
  canonicalPath = "/",
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  faqs,
  schemaOverride,
}) => {
  const fullUrl = `${BASE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  useEffect(() => {
    // 1. Update Title
    document.title = title.includes("Smart Civic") ? title : `${title} | Smart Civic AI`;

    // 2. Helper to set or create meta tag
    const setMeta = (nameAttr: "name" | "property", attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrVal}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(nameAttr, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard SEO Tags
    setMeta("name", "description", description);
    if (keywords) {
      setMeta("name", "keywords", keywords);
    }

    // OpenGraph Tags
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", fullUrl);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", ogImage);

    // Twitter Tags
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);

    // Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    // 3. Dynamic JSON-LD Schema Injection (AEO, GEO, Breadcrumbs)
    const scriptId = "dynamic-seo-schema";
    let schemaScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.id = scriptId;
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }

    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": BASE_URL
        },
        ...(canonicalPath !== "/" ? [
          {
            "@type": "ListItem",
            "position": 2,
            "name": title.split("|")[0].trim(),
            "item": fullUrl
          }
        ] : [])
      ]
    };

    let dynamicSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${fullUrl}#webpage`,
          url: fullUrl,
          name: title,
          description,
          inLanguage: "en-IN",
          isPartOf: {
            "@type": "WebSite",
            name: "Smart Civic AI CityOS",
            url: BASE_URL,
          },
        },
        breadcrumbSchema,
        ...(faqs && faqs.length > 0 ? [
          {
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.answer,
              },
            })),
          }
        ] : []),
      ]
    };

    if (schemaOverride) {
      dynamicSchema = schemaOverride;
    }

    schemaScript.textContent = JSON.stringify(dynamicSchema, null, 2);

    return () => {
      // Cleanup custom schema on unmount
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, keywords, fullUrl, ogType, ogImage, faqs, schemaOverride, canonicalPath]);

  return null;
};

export default SeoHead;
