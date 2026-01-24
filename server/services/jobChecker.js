import cron from 'node-cron';
import { getAllPeople, updatePerson } from './dataStore.js';
import { searchPerson } from './serper.js';
import { sendJobChangeAlert } from './emailService.js';

/**
 * Job Checker Service
 * Automatically checks for job changes on a scheduled basis
 * Uses intelligent analysis of search results to detect changes
 */

let isRunning = false;
let lastRunTime = null;
let lastRunResults = [];

// Keywords that indicate a job change
const CHANGE_KEYWORDS = [
  'joins', 'joined', 'joining',
  'appointed', 'named', 'promoted',
  'new role', 'new position', 'new job',
  'now serves', 'now works', 'now leads',
  'starts as', 'started as', 'starting as',
  'announces', 'announced',
  'hired as', 'hired to',
  'moves to', 'moved to',
  'takes over', 'taking over',
  'becomes', 'became'
];

// Patterns to extract dates from snippets
const DATE_PATTERNS = [
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+\d{4}\b/i,
  /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
  /\b(q[1-4])\s+\d{4}\b/i,
  /\b\d{4}\b/,
  /\brecently\b/i,
  /\bthis (month|year|week)\b/i,
  /\blast (month|year|week)\b/i
];

/**
 * Analyze search results to detect job changes
 * @param {Array} results - Raw search results from Serper
 * @param {Object} currentJob - Person's current job info
 * @param {string} personName - Person's name
 * @returns {Object} Analysis result with change detection
 */
function analyzeResultsForChanges(results, currentJob, personName) {
  const analysis = {
    changeDetected: false,
    confidence: 0,
    newRole: null,
    newCompany: null,
    evidence: [],
    allExtractedJobs: []
  };

  if (!results || results.length === 0) {
    return analysis;
  }

  const currentCompanyLower = (currentJob?.company || '').toLowerCase();
  const currentRoleLower = (currentJob?.role || '').toLowerCase();

  for (const result of results) {
    const title = result.title || '';
    const snippet = result.snippet || '';
    const link = result.link || '';
    const combined = `${title} ${snippet}`.toLowerCase();

    // Check for change keywords
    const foundChangeKeywords = CHANGE_KEYWORDS.filter(kw => combined.includes(kw));
    const hasChangeSignal = foundChangeKeywords.length > 0;

    // Check for date patterns (indicates recency)
    const foundDates = DATE_PATTERNS.filter(pattern => pattern.test(combined));
    const hasRecentDate = foundDates.length > 0;

    // Try to extract job info from this result
    const extractedJob = extractJobFromResult(title, snippet, personName);
    
    if (extractedJob.role || extractedJob.company) {
      analysis.allExtractedJobs.push({
        ...extractedJob,
        source: link,
        hasChangeSignal,
        hasRecentDate,
        changeKeywords: foundChangeKeywords
      });
    }

    // Look for evidence of a NEW job (different from current)
    if (hasChangeSignal) {
      const mentionsDifferentCompany = extractedJob.company && 
        !extractedJob.company.toLowerCase().includes(currentCompanyLower) &&
        !currentCompanyLower.includes(extractedJob.company.toLowerCase());
      
      const mentionsDifferentRole = extractedJob.role &&
        !extractedJob.role.toLowerCase().includes(currentRoleLower) &&
        !currentRoleLower.includes(extractedJob.role.toLowerCase());

      if (mentionsDifferentCompany || mentionsDifferentRole) {
        analysis.evidence.push({
          type: mentionsDifferentCompany ? 'company_change' : 'role_change',
          source: link,
          snippet: snippet.substring(0, 200),
          extractedRole: extractedJob.role,
          extractedCompany: extractedJob.company,
          keywords: foundChangeKeywords,
          hasDate: hasRecentDate
        });
      }
    }
  }

  // Analyze collected evidence to determine if there's a real change
  if (analysis.evidence.length > 0) {
    // Sort evidence by strength (more keywords + date = stronger)
    analysis.evidence.sort((a, b) => {
      const scoreA = a.keywords.length + (a.hasDate ? 2 : 0);
      const scoreB = b.keywords.length + (b.hasDate ? 2 : 0);
      return scoreB - scoreA;
    });

    const strongestEvidence = analysis.evidence[0];
    
    // Calculate confidence based on evidence strength
    let confidence = 0;
    confidence += Math.min(strongestEvidence.keywords.length * 20, 40); // Up to 40 for keywords
    confidence += strongestEvidence.hasDate ? 30 : 0; // 30 for having a date
    confidence += analysis.evidence.length > 1 ? 20 : 0; // 20 for multiple sources
    confidence += strongestEvidence.extractedRole ? 10 : 0; // 10 for having a role

    analysis.confidence = Math.min(confidence, 100);

    // Only flag as change if confidence is high enough (>= 50)
    if (analysis.confidence >= 50) {
      analysis.changeDetected = true;
      analysis.newRole = strongestEvidence.extractedRole;
      analysis.newCompany = strongestEvidence.extractedCompany;
    }
  }

  return analysis;
}

/**
 * Extract job information from a search result
 * @param {string} title - Result title
 * @param {string} snippet - Result snippet
 * @param {string} personName - Person's name to filter out
 * @returns {Object} Extracted job info
 */
function extractJobFromResult(title, snippet, personName) {
  const result = { role: null, company: null };
  const nameLower = personName.toLowerCase();

  // Try to extract from LinkedIn-style title: "Name - Role at Company"
  const linkedInMatch = title.match(/^.+?\s*[-–]\s*(.+?)\s+at\s+(.+?)(?:\s*\||\s*-\s*LinkedIn|$)/i);
  if (linkedInMatch) {
    result.role = linkedInMatch[1].trim();
    result.company = linkedInMatch[2].trim().replace(/\s*\|.*$/, '').trim();
  }

  // Try to extract from snippet patterns
  if (!result.role) {
    const rolePatterns = [
      // "joins CompanyX as Role"
      /joins?\s+(.+?)\s+as\s+(.+?)(?:\.|,|$)/i,
      // "appointed/named Role at Company"
      /(?:appointed|named|promoted to)\s+(.+?)\s+(?:at|of)\s+(.+?)(?:\.|,|$)/i,
      // "new Role at Company"
      /new\s+(.+?)\s+at\s+(.+?)(?:\.|,|$)/i,
      // "is now Role at Company"
      /is\s+now\s+(.+?)\s+at\s+(.+?)(?:\.|,|$)/i,
      // "starts as Role at Company"
      /starts?\s+as\s+(.+?)\s+at\s+(.+?)(?:\.|,|$)/i
    ];

    for (const pattern of rolePatterns) {
      const match = snippet.match(pattern);
      if (match) {
        // Pattern might capture role first or company first depending on pattern
        if (pattern.toString().includes('joins')) {
          result.company = match[1].trim();
          result.role = match[2].trim();
        } else {
          result.role = match[1].trim();
          result.company = match[2].trim();
        }
        break;
      }
    }
  }

  // Clean up extracted values
  if (result.role) {
    result.role = result.role
      .replace(/\s*\|.*$/, '')
      .replace(/\s*-\s*LinkedIn.*$/i, '')
      .replace(/["""]/g, '')
      .trim();
    
    // Don't return if it's just the person's name
    if (result.role.toLowerCase().includes(nameLower)) {
      result.role = null;
    }
  }

  if (result.company) {
    result.company = result.company
      .replace(/\s*\|.*$/, '')
      .replace(/["""]/g, '')
      .trim();
  }

  return result;
}

/**
 * Check a single person for job changes
 * @param {Object} person - Person object from database
 * @returns {Promise<Object>} Result of the check
 */
async function checkPersonForChanges(person) {
  const result = {
    personId: person.id,
    name: person.name,
    checked: true,
    changed: false,
    previousRole: person.currentJob?.role,
    previousCompany: person.currentJob?.company,
    newRole: null,
    newCompany: null,
    confidence: 0,
    evidence: [],
    error: null
  };

  try {
    // Search for the person with their current company
    const searchResults = await searchPerson(person.name, person.currentJob?.company || '');
    
    // Analyze results for change signals
    const analysis = analyzeResultsForChanges(
      searchResults.rawResults,
      person.currentJob,
      person.name
    );

    result.confidence = analysis.confidence;
    result.evidence = analysis.evidence.slice(0, 3); // Top 3 pieces of evidence

    if (analysis.changeDetected) {
      result.changed = true;
      result.newRole = analysis.newRole || person.currentJob?.role;
      result.newCompany = analysis.newCompany || person.currentJob?.company;

      // Update the person's record
      await updatePerson(person.id, {
        currentJob: {
          company: result.newCompany,
          role: result.newRole,
          startDate: formatDate(new Date())
        },
        lastChecked: formatDate(new Date())
      });

      console.log(`[JobChecker] Job change detected for ${person.name} (confidence: ${analysis.confidence}%)`);
      console.log(`  Previous: ${person.currentJob?.role} at ${person.currentJob?.company}`);
      console.log(`  New: ${result.newRole} at ${result.newCompany}`);

      // Send email alert for the job change
      try {
        const emailResult = await sendJobChangeAlert({
          personName: person.name,
          previousRole: person.currentJob?.role,
          previousCompany: person.currentJob?.company,
          newRole: result.newRole,
          newCompany: result.newCompany,
          confidence: analysis.confidence,
          evidence: result.evidence,
          recipients: person.emailRecipients || []
        });

        if (emailResult.success) {
          console.log(`[JobChecker] Email alert sent successfully for ${person.name}`);
        } else {
          console.warn(`[JobChecker] Failed to send email alert for ${person.name}: ${emailResult.error}`);
        }
      } catch (emailError) {
        // Don't fail the job check if email fails
        console.error(`[JobChecker] Error sending email alert for ${person.name}:`, emailError.message);
      }
    } else {
      // Just update the lastChecked date
      await updatePerson(person.id, {
        lastChecked: formatDate(new Date())
      });
    }
  } catch (error) {
    result.error = error.message;
    result.checked = false;
    console.error(`[JobChecker] Error checking ${person.name}:`, error.message);
  }

  return result;
}

/**
 * Run job check for all monitored people
 * @returns {Promise<Object>} Summary of the check run
 */
async function runJobCheck() {
  if (isRunning) {
    console.log('[JobChecker] Check already in progress, skipping...');
    return { success: false, message: 'Check already in progress' };
  }

  isRunning = true;
  console.log('[JobChecker] Starting job check for all people...');

  const startTime = Date.now();
  const results = [];

  try {
    const people = await getAllPeople();
    
    if (people.length === 0) {
      console.log('[JobChecker] No people to check');
      isRunning = false;
      return { success: true, message: 'No people to check', results: [] };
    }

    // Check each person with a delay to avoid rate limiting
    for (const person of people) {
      const result = await checkPersonForChanges(person);
      results.push(result);
      
      // Wait 2 seconds between checks to be nice to the API
      if (people.indexOf(person) < people.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const changesDetected = results.filter(r => r.changed).length;
    const errors = results.filter(r => r.error).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    lastRunTime = new Date();
    lastRunResults = results;

    console.log(`[JobChecker] Completed in ${duration}s. Checked: ${results.length}, Changes: ${changesDetected}, Errors: ${errors}`);

    return {
      success: true,
      timestamp: lastRunTime.toISOString(),
      duration: `${duration}s`,
      totalChecked: results.length,
      changesDetected,
      errors,
      results
    };
  } catch (error) {
    console.error('[JobChecker] Run failed:', error);
    return { success: false, message: error.message };
  } finally {
    isRunning = false;
  }
}

/**
 * Get the status of the job checker
 */
function getStatus() {
  return {
    isRunning,
    lastRunTime: lastRunTime?.toISOString() || null,
    lastRunResults: lastRunResults.map(r => ({
      name: r.name,
      changed: r.changed,
      confidence: r.confidence,
      newRole: r.newRole,
      newCompany: r.newCompany,
      error: r.error
    }))
  };
}

/**
 * Start the scheduled job checker
 * Runs every Sunday at 2:00 AM
 */
function startScheduler() {
  // Cron expression: minute hour day-of-month month day-of-week
  // '0 2 * * 0' = At 02:00 on Sunday
  cron.schedule('0 2 * * 0', async () => {
    console.log('[JobChecker] Running scheduled weekly check...');
    await runJobCheck();
  });

  console.log('[JobChecker] Scheduler started - will run every Sunday at 2:00 AM');
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export { runJobCheck, getStatus, startScheduler };
