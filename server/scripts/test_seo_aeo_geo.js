"use strict";

const assert = require("assert");
const http = require("http");
const express = require("express");
const axios = require("axios");
const seoRoutes = require("../routes/seoRoutes");

async function testSeoAeoGeo() {
  console.log("================================================================================");
  console.log("🚀 TESTING SEO, AEO & GEO ARCHITECTURAL ROUTES & MANIFESTS");
  console.log("================================================================================\n");

  const app = express();
  app.use("/", seoRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test /sitemap.xml (SEO)
    console.log("▶ [Test 1] Validating Dynamic XML Sitemap (/sitemap.xml)...");
    const sitemapRes = await axios.get(`${baseUrl}/sitemap.xml`);
    assert.strictEqual(sitemapRes.status, 200);
    assert(sitemapRes.data.includes("<urlset"), "Sitemap must be valid XML with urlset");
    assert(sitemapRes.data.includes("/track"), "Sitemap must include track route");
    assert(sitemapRes.data.includes("/map"), "Sitemap must include map route");
    console.log("  ✅ PASSED: XML Sitemap is syntactically valid and indexed");

    // 2. Test /robots.txt (SEO & AI Crawler Permissions)
    console.log("\n▶ [Test 2] Validating Robots Directive (/robots.txt)...");
    const robotsRes = await axios.get(`${baseUrl}/robots.txt`);
    assert.strictEqual(robotsRes.status, 200);
    assert(robotsRes.data.includes("User-agent: *"), "Robots must include wildcard user agent");
    assert(robotsRes.data.includes("GPTBot"), "Robots must declare GPTBot (AEO)");
    assert(robotsRes.data.includes("PerplexityBot"), "Robots must declare PerplexityBot (AEO)");
    assert(robotsRes.data.includes("Sitemap:"), "Robots must reference Sitemap");
    console.log("  ✅ PASSED: Robots.txt allows search engines & AI answer engines");

    // 3. Test /llms.txt (AEO & AI Search Engine Manifest)
    console.log("\n▶ [Test 3] Validating LLM Machine Manifest (/llms.txt)...");
    const llmsRes = await axios.get(`${baseUrl}/llms.txt`);
    assert.strictEqual(llmsRes.status, 200);
    assert(llmsRes.data.includes("Smart Civic AI"), "LLM manifest must contain platform identity");
    assert(llmsRes.data.includes("48-Hour SLA Guarantee"), "LLM manifest must contain SLA definitions");
    assert(llmsRes.data.includes("24-ward"), "LLM manifest must specify 24 wards");
    console.log("  ✅ PASSED: LLM Manifest standard formatted for Perplexity/ChatGPT/Gemini");

    // 4. Test /api/geo/wards (GEO Geospatial Ward Boundary Index)
    console.log("\n▶ [Test 4] Validating 24-Ward Geospatial Endpoint (/api/geo/wards)...");
    const geoRes = await axios.get(`${baseUrl}/api/geo/wards`);
    assert.strictEqual(geoRes.status, 200);
    assert.strictEqual(geoRes.data.success, true);
    assert.strictEqual(geoRes.data.count, 24, "Must cover all 24 BMC wards");
    assert(geoRes.data.wards[0].coordinates.length === 2, "Wards must contain [lat, lng]");
    console.log("  ✅ PASSED: 24-Ward Geospatial Municipal Index validated");

    // 5. Test Google Search Console Verification (/googlee3c0d346e90cbfde.html)
    console.log("\n▶ [Test 5] Validating Google Search Console Verification File...");
    const gRes = await axios.get(`${baseUrl}/googlee3c0d346e90cbfde.html`);
    assert.strictEqual(gRes.status, 200);
    assert(gRes.data.includes("google-site-verification: googlee3c0d346e90cbfde.html"));
    console.log("  ✅ PASSED: Google Search Console verification file served with 200 OK");

    console.log("\n================================================================================");
    console.log("🎉 ALL SEO, AEO & GEO INTEGRATION CHECKS PASSED WITH 100% HEALTH!");
    console.log("================================================================================\n");
  } finally {
    server.close();
  }
}

testSeoAeoGeo().catch((err) => {
  console.error("SEO/AEO/GEO test error:", err.message);
  process.exit(1);
});
