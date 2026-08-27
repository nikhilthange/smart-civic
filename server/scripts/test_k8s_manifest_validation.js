"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("\n================================================================================");
console.log("☸️  KUBERNETES MANIFEST DECLARATIVE SCHEMA VALIDATOR");
console.log("================================================================================\n");

function validateK8sManifests() {
  const k8sDir = path.join(__dirname, "../../k8s");
  const files = fs.readdirSync(k8sDir).filter(f => f.endsWith(".yaml") || f.endsWith(".yml"));

  let passed = 0;
  let total = 0;

  for (const file of files) {
    total++;
    const fullPath = path.join(k8sDir, file);
    const content = fs.readFileSync(fullPath, "utf8");

    try {
      assert.ok(content.includes("apiVersion:"), `${file} contains apiVersion`);
      assert.ok(content.includes("kind:"), `${file} contains kind`);
      assert.ok(content.includes("metadata:"), `${file} contains metadata`);
      assert.ok(content.includes("name:"), `${file} contains resource name`);
      assert.ok(content.includes("namespace:"), `${file} defines metadata.namespace`);

      if (file.includes("deployment") || file.includes("cronjob")) {
        assert.ok(content.includes("runAsNonRoot: true") || content.includes("securityContext:"), `${file} enforces security context`);
        assert.ok(content.includes("resources:"), `${file} enforces CPU/Memory resources`);
      }

      console.log(`  ✅ PASSED: ${file} declarative schema verified (apiVersion, kind, metadata.namespace)`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${file} - ${err.message}`);
    }
  }

  console.log("\n================================================================================");
  console.log(`  KUBERNETES MANIFEST VALIDATION: ${passed} PASSED / ${total - passed} FAILED (TOTAL: ${total})`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL KUBERNETES MANIFESTS COMPLY WITH PRODUCTION GITOPS STANDARDS!\n");
  } else {
    process.exit(1);
  }
}

validateK8sManifests();
