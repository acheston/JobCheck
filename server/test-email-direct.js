import dotenv from 'dotenv';
import { sendJobChangeAlert } from './services/emailService.js';

// Load environment variables
dotenv.config();

/**
 * Direct test of email alert functionality
 * Simulates a job change detection for Jim Hanson
 */
async function testEmailDirect() {
  console.log('🧪 Testing email alert directly...\n');

  try {
    const emailResult = await sendJobChangeAlert({
      personName: 'Jim Hanson',
      previousRole: 'VP of HR',
      previousCompany: 'Jackknife, Inc',
      newRole: 'VP of Talent',
      newCompany: 'Realknife, LLC',
      confidence: 100,
      evidence: [
        {
          type: 'company_change',
          source: 'https://test.example.com',
          snippet: 'Test evidence: Jim Hanson has moved to Realknife, LLC as VP of Talent',
          extractedRole: 'VP of Talent',
          extractedCompany: 'Realknife, LLC',
          keywords: ['moved', 'new role'],
          hasDate: true
        }
      ]
    });

    if (emailResult.success) {
      console.log('✅ Email alert sent successfully!');
      console.log(`   Email IDs: ${emailResult.emailIds?.join(', ') || 'N/A'}`);
      console.log(`   Recipients: ${process.env.EMAIL_RECIPIENTS}\n`);
      console.log('📧 Check your inbox at aric.cheston@gmail.com\n');
    } else {
      console.error('❌ Failed to send email alert:', emailResult.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailDirect();
