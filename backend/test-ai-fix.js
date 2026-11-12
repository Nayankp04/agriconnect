/**
 * Comprehensive Automated Verification Suite for AgriConnect AI Assistant
 * Validates all 6 mandatory test scenarios from the specification:
 * Test 1: "How can I grow tomatoes?"
 * Test 2: "What is the difference between organic and chemical fertilizers?"
 * Test 3: "My tomato leaves are turning yellow. What should I do?"
 * Test 4: "What is artificial intelligence?"
 * Test 5: "Explain drip irrigation."
 * Test 6: Consecutive unrelated questions in same session (verifies zero cross-talk & no repeated answers)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/config.env') });
const { processTextConversation } = require('./ai/services/voiceAssistantService');
const conversationService = require('./ai/services/conversationService');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🌾 AGRICONNECT AI ASSISTANT: VERIFICATION TEST SUITE 🌾');
  console.log('================================================================\n');

  const results = [];

  try {
    // -------------------------------------------------------------------------
    // Test 1: "How can I grow tomatoes?"
    // -------------------------------------------------------------------------
    console.log('--- Test 1: "How can I grow tomatoes?" ---');
    const t1 = await processTextConversation({
      queryText: 'How can I grow tomatoes?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: 'sess_test_1',
      skipTTS: true,
    });

    const t1Resp = t1.assistantResponse;
    console.log('Intent:', t1.reasoning.intent);
    console.log('Response excerpt:\n', t1Resp.substring(0, 250) + '...\n');

    const t1Passed =
      t1Resp.toLowerCase().includes('soil') &&
      t1Resp.toLowerCase().includes('seed') &&
      t1Resp.toLowerCase().includes('water') &&
      (t1Resp.toLowerCase().includes('fertilizer') || t1Resp.toLowerCase().includes('fym') || t1Resp.toLowerCase().includes('npk')) &&
      t1Resp.toLowerCase().includes('harvest');

    results.push({
      test: 'Test 1: How can I grow tomatoes?',
      intent: t1.reasoning.intent,
      passed: Boolean(t1Passed),
      details: 'Contains soil, seed, water, fertilizer, and harvesting guidance.',
    });

    // -------------------------------------------------------------------------
    // Test 2: "What is the difference between organic and chemical fertilizers?"
    // -------------------------------------------------------------------------
    console.log('--- Test 2: "What is the difference between organic and chemical fertilizers?" ---');
    const t2 = await processTextConversation({
      queryText: 'What is the difference between organic and chemical fertilizers?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: 'sess_test_2',
      skipTTS: true,
    });

    const t2Resp = t2.assistantResponse;
    console.log('Intent:', t2.reasoning.intent);
    console.log('Response excerpt:\n', t2Resp.substring(0, 250) + '...\n');

    const t2Passed =
      t2Resp.toLowerCase().includes('organic') &&
      t2Resp.toLowerCase().includes('chemical') &&
      (t2Resp.toLowerCase().includes('soil') || t2Resp.toLowerCase().includes('release')) &&
      !t2Resp.includes('Step-by-Step Guide for Tomato Cultivation');

    results.push({
      test: 'Test 2: Difference between organic and chemical fertilizers',
      intent: t2.reasoning.intent,
      passed: Boolean(t2Passed),
      details: 'Provides a relevant comparison, not tomato cultivation instructions.',
    });

    // -------------------------------------------------------------------------
    // Test 3: "My tomato leaves are turning yellow. What should I do?"
    // -------------------------------------------------------------------------
    console.log('--- Test 3: "My tomato leaves are turning yellow. What should I do?" ---');
    const t3 = await processTextConversation({
      queryText: 'My tomato leaves are turning yellow. What should I do?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: 'sess_test_3',
      skipTTS: true,
    });

    const t3Resp = t3.assistantResponse;
    console.log('Intent:', t3.reasoning.intent);
    console.log('Response excerpt:\n', t3Resp.substring(0, 250) + '...\n');

    const t3Passed =
      (t3Resp.toLowerCase().includes('nitrogen') || t3Resp.toLowerCase().includes('water') || t3Resp.toLowerCase().includes('blight')) &&
      (t3Resp.includes('?') || t3Resp.toLowerCase().includes('diagnos') || t3Resp.toLowerCase().includes('action') || t3Resp.toLowerCase().includes('check'));

    results.push({
      test: 'Test 3: Tomato leaves turning yellow',
      intent: t3.reasoning.intent,
      passed: Boolean(t3Passed),
      details: 'Explains possible causes, asks about symptoms, suggests diagnostic steps.',
    });

    // -------------------------------------------------------------------------
    // Test 4: "What is artificial intelligence?"
    // -------------------------------------------------------------------------
    console.log('--- Test 4: "What is artificial intelligence?" ---');
    const t4 = await processTextConversation({
      queryText: 'What is artificial intelligence?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: 'sess_test_4',
      skipTTS: true,
    });

    const t4Resp = t4.assistantResponse;
    console.log('Intent:', t4.reasoning.intent);
    console.log('Response excerpt:\n', t4Resp.substring(0, 250) + '...\n');

    const t4Passed =
      (t4Resp.toLowerCase().includes('machine learning') || t4Resp.toLowerCase().includes('human') || t4Resp.toLowerCase().includes('computer')) &&
      !t4Resp.includes('Marketplace / Procurement');

    results.push({
      test: 'Test 4: What is artificial intelligence?',
      intent: t4.reasoning.intent,
      passed: Boolean(t4Passed),
      details: 'Explains AI accurately without forcing an irrelevant agricultural answer.',
    });

    // -------------------------------------------------------------------------
    // Test 5: "Explain drip irrigation."
    // -------------------------------------------------------------------------
    console.log('--- Test 5: "Explain drip irrigation." ---');
    const t5 = await processTextConversation({
      queryText: 'Explain drip irrigation.',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: 'sess_test_5',
      skipTTS: true,
    });

    const t5Resp = t5.assistantResponse;
    console.log('Intent:', t5.reasoning.intent);
    console.log('Response excerpt:\n', t5Resp.substring(0, 250) + '...\n');

    const t5Passed =
      (t5Resp.toLowerCase().includes('root') || t5Resp.toLowerCase().includes('drop')) &&
      (t5Resp.toLowerCase().includes('benefit') || t5Resp.toLowerCase().includes('efficiency') || t5Resp.toLowerCase().includes('advantage') || t5Resp.toLowerCase().includes('water')) &&
      (t5Resp.toLowerCase().includes('limitation') || t5Resp.toLowerCase().includes('clog') || t5Resp.toLowerCase().includes('cost'));

    results.push({
      test: 'Test 5: Explain drip irrigation',
      intent: t5.reasoning.intent,
      passed: Boolean(t5Passed),
      details: 'Explains drip irrigation, its working, benefits, and limitations.',
    });

    // -------------------------------------------------------------------------
    // Test 6: Ask two completely unrelated questions consecutively in same session
    // -------------------------------------------------------------------------
    console.log('--- Test 6: Consecutive Unrelated Questions in Same Session ---');
    const sess6 = `sess_unrelated_${Date.now()}`;

    // Question 6A: Tomato cultivation
    console.log('   6A: "How can I grow tomatoes?"');
    const q6a = await processTextConversation({
      queryText: 'How can I grow tomatoes?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: sess6,
      skipTTS: true,
    });
    const q6aResp = q6a.assistantResponse;
    console.log('   6A Intent:', q6a.reasoning.intent);

    // Question 6B: Unrelated general knowledge question in SAME session
    console.log('   6B: "What is the capital of France?"');
    const q6b = await processTextConversation({
      queryText: 'What is the capital of France?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: sess6,
      skipTTS: true,
    });
    const q6bResp = q6b.assistantResponse;
    console.log('   6B Intent:', q6b.reasoning.intent);
    console.log('   6B Response excerpt:', q6bResp.substring(0, 150));

    // Question 6C: Unrelated technology question in SAME session
    console.log('   6C: "What is artificial intelligence?"');
    const q6c = await processTextConversation({
      queryText: 'What is artificial intelligence?',
      language: 'en-IN',
      role: 'FARMER',
      sessionId: sess6,
      skipTTS: true,
    });
    const q6cResp = q6c.assistantResponse;
    console.log('   6C Intent:', q6c.reasoning.intent);

    const t6Passed =
      q6bResp.toLowerCase().includes('paris') &&
      !q6bResp.toLowerCase().includes('tomato') &&
      q6cResp.toLowerCase().includes('machine learning') &&
      q6aResp !== q6bResp &&
      q6bResp !== q6cResp;

    results.push({
      test: 'Test 6: Consecutive unrelated questions in same session',
      intent: `${q6a.reasoning.intent} -> ${q6b.reasoning.intent} -> ${q6c.reasoning.intent}`,
      passed: Boolean(t6Passed),
      details: 'Each question answered distinctly with zero entity bleed and no repeated answers.',
    });

    console.log('\n================================================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('================================================================');
    let allPassed = true;
    for (const r of results) {
      console.log(`${r.passed ? '✅' : '❌'} ${r.test}`);
      console.log(`   Intent: ${r.intent} | Details: ${r.details}`);
      if (!r.passed) allPassed = false;
    }
    console.log('================================================================');
    if (!allPassed) {
      throw new Error('One or more verification tests failed!');
    }
    console.log('🎉 ALL 6 MANDATORY TESTS PASSED SUCCESSFULLY! 🎉\n');

  } catch (err) {
    console.error('❌ Test suite execution error:', err);
    process.exitCode = 1;
  }
}

runTestSuite();
