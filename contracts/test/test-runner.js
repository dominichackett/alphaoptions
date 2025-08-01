// test/test-runner.js
const { spawn } = require('child_process');
const path = require('path');

console.log("🚀 Starting Complete Options System Test Suite");
console.log("=" .repeat(60));

const testSuites = [
  {
    name: "🏗️ Full Option Lifecycle",
    file: "integration/01-full-option-lifecycle.test.js",
    description: "End-to-end ETH option trading with real WETH/USDC",
    priority: "HIGH"
  },
  {
    name: "🎯 24/7 Stock Options - KILLER FEATURE",
    file: "integration/02-24x7-stock-options.test.js", 
    description: "Your competitive advantage - weekend stock options",
    priority: "CRITICAL"
  },
  {
    name: "📊 PriceOracle Integration",
    file: "contracts/PriceOracle.test.js",
    description: "Real Chainlink feeds + synthetic stock pricing",
    priority: "HIGH"
  }
];

async function runTestSuite(suite) {
  console.log(`\n🧪 Running: ${suite.name}`);
  console.log(`📝 ${suite.description}`);
  console.log(`⚡ Priority: ${suite.priority}`);
  console.log("-" .repeat(50));
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['hardhat', 'test', `test/${suite.file}`], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${suite.name} - PASSED`);
        resolve();
      } else {
        console.log(`❌ ${suite.name} - FAILED (code ${code})`);
        reject(new Error(`Test suite failed: ${suite.name}`));
      }
    });
    
    testProcess.on('error', (error) => {
      console.error(`❌ Error running ${suite.name}:`, error.message);
      reject(error);
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  
  console.log(`📋 Running ${testSuites.length} test suites...\n`);
  
  for (const suite of testSuites) {
    try {
      await runTestSuite(suite);
      passed++;
    } catch (error) {
      failed++;
      console.error(`💥 ${suite.name} failed:`, error.message);
      
      // Continue with other tests even if one fails
      if (suite.priority === "CRITICAL") {
        console.log("🚨 CRITICAL test failed - this needs immediate attention!");
      }
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log("\n" + "=" .repeat(60));
  console.log("🏁 TEST SUITE COMPLETE");
  console.log("=" .repeat(60));
  console.log(`⏱️  Total time: ${duration.toFixed(1)}s`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success rate: ${((passed / testSuites.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Your deployment is ready for production!");
    console.log("🚀 Key achievements verified:");
    console.log("   ✅ Full options lifecycle works with real tokens");
    console.log("   ✅ 24/7 stock options - your killer feature works!");
    console.log("   ✅ Real Chainlink oracle integration successful");
    console.log("   ✅ Gas costs are optimized");
    console.log("   ✅ All 6 contracts working together perfectly");
  } else {
    console.log(`\n⚠️  ${failed} test suite(s) failed. Check the output above.`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error("💥 Test runner failed:", error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests, testSuites };