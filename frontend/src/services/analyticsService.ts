/**
 * Smart Civic Telemetry & Web Analytics Service
 * Lightweight, privacy-conscious event & pageview tracker.
 * Supports Google Analytics 4 (GA4), Plausible, or local telemetry logging.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

class AnalyticsService {
  private isInitialized = false;
  private consentGiven = false;
  private measurementId: string | null = null;

  constructor() {
    // Check if user has consented in localStorage
    const consent = localStorage.getItem("smart_civic_cookie_consent");
    this.consentGiven = consent === "all" || consent === "analytics";
    this.measurementId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || null;
  }

  public init() {
    if (this.isInitialized || typeof window === "undefined") return;

    if (this.measurementId && this.consentGiven) {
      this.loadGoogleAnalytics(this.measurementId);
    }

    this.isInitialized = true;
  }

  public updateConsent(analyticsAllowed: boolean) {
    this.consentGiven = analyticsAllowed;
    if (analyticsAllowed && this.measurementId && !window.gtag) {
      this.loadGoogleAnalytics(this.measurementId);
    }
  }

  private loadGoogleAnalytics(id: string) {
    try {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };

      window.gtag("js", new Date());
      window.gtag("config", id, {
        anonymize_ip: true,
        send_page_view: false, // We trigger pageviews manually on router change
      });
    } catch (e) {
      console.warn("[Analytics] Failed to load GA script:", e);
    }
  }

  public trackPageView(path: string, title?: string) {
    if (typeof window === "undefined") return;

    if (window.gtag && this.measurementId && this.consentGiven) {
      window.gtag("event", "page_view", {
        page_path: path,
        page_title: title || document.title,
        page_location: window.location.href,
      });
    }

    if ((import.meta as any).env?.DEV) {
      // Local development debug log
      console.log(`[Analytics] 📊 Pageview: ${path} - "${title || document.title}"`);
    }
  }

  public trackEvent(eventName: string, params: Record<string, any> = {}) {
    if (typeof window === "undefined") return;

    if (window.gtag && this.consentGiven) {
      window.gtag("event", eventName, params);
    }

    if ((import.meta as any).env?.DEV) {
      console.log(`[Analytics] ⚡ Event: ${eventName}`, params);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
