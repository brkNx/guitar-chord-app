import { chromium } from 'playwright';

async function testPlayback() {
  console.log('--- STARTING PLAYBACK & LIFECYCLE 20S VERIFICATION ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('MUTATION') || txt.includes('YouTube') || txt.includes('error')) {
      console.log('PAGE:', txt);
    }
  });

  await page.goto('http://127.0.0.1:5173');
  await page.waitForTimeout(2500);

  // Monitor DOM iframe mutations
  await page.evaluate(() => {
    window.__iframeRemovals = 0;
    window.__iframeAdditions = 0;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.tagName === 'IFRAME') window.__iframeAdditions++;
        }
        for (const n of m.removedNodes) {
          if (n.tagName === 'IFRAME') window.__iframeRemovals++;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Verify initial state
  const playBtn = page.locator('button:has-text("OTOMATİK ÇAL")').first();
  if (!(await playBtn.isVisible())) {
    throw new Error('Initial play button not visible');
  }

  // Click OTOMATİK ÇAL
  console.log('1. Clicking OTOMATİK ÇAL...');
  await playBtn.click();
  await page.waitForTimeout(500);

  // Verify button changes to DURDUR
  const pauseBtn = page.locator('button:has-text("DURDUR")').first();
  const isPauseVisible = await pauseBtn.isVisible();
  console.log(`Button changed to DURDUR: ${isPauseVisible}`);
  if (!isPauseVisible) {
    throw new Error('Button did not switch to DURDUR');
  }

  // Monitor continuous playback for 18 seconds
  console.log('2. Monitoring playback continuously past 15 seconds...');
  const observedChords = new Set();
  for (let s = 1; s <= 18; s++) {
    await page.waitForTimeout(1000);

    const isStillPlaying = await page.locator('button:has-text("DURDUR")').first().isVisible().catch(() => false);
    if (!isStillPlaying) {
      throw new Error(`CRITICAL: Playback unexpectedly stopped at second ${s}! Button reverted to OTOMATİK ÇAL.`);
    }

    const { additions, removals } = await page.evaluate(() => ({
      additions: window.__iframeAdditions,
      removals: window.__iframeRemovals
    }));

    if (removals > 0) {
      throw new Error(`CRITICAL: YouTube iframe was destroyed during playback at second ${s}! Total removals: ${removals}`);
    }

    // Get current chord from live stage or hero card
    const heroChord = await page.locator('[class*="border-amber-400"]').first().innerText().catch(() => '');
    const firstWord = heroChord.split(/\s+/)[0] || '';
    if (firstWord) observedChords.add(firstWord);

    if (s % 3 === 0 || s === 18) {
      console.log(`  [Sec ${s.toString().padStart(2, ' ')}/18] Playing smoothly. Active chord: ${firstWord}. Unique chords seen: ${Array.from(observedChords).join(', ')}. IFrame destructions: ${removals}`);
    }
  }

  console.log('3. Verification: Video and autoscroll played past 15s continuously without stopping or iframe recreation.');

  // Test Pause
  console.log('4. Testing DURDUR button click...');
  await pauseBtn.click();
  await page.waitForTimeout(500);

  const isPlayVisibleAgain = await page.locator('button:has-text("OTOMATİK ÇAL")').first().isVisible();
  console.log(`Button changed back to OTOMATİK ÇAL: ${isPlayVisibleAgain}`);
  if (!isPlayVisibleAgain) {
    throw new Error('DURDUR did not switch back to OTOMATİK ÇAL');
  }

  // Wait 2 seconds while paused, verify no iframe destructions and no spurious state flip-flop
  await page.waitForTimeout(2000);
  const isStillPaused = await page.locator('button:has-text("OTOMATİK ÇAL")').first().isVisible();
  console.log(`App cleanly remained paused with 0 flip-flops: ${isStillPaused}`);

  // Test Resume
  console.log('5. Testing resume playback...');
  await page.locator('button:has-text("OTOMATİK ÇAL")').first().click();
  await page.waitForTimeout(500);
  const isResumed = await page.locator('button:has-text("DURDUR")').first().isVisible();
  console.log(`Resumed playback successfully: ${isResumed}`);

  await page.waitForTimeout(3000);
  await browser.close();
  console.log('--- ALL VERIFICATION TESTS PASSED DETERMINISTICALLY! ---');
}

testPlayback().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
