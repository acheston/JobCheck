import dotenv from 'dotenv';
import { addPerson, updatePerson, getPersonById } from './services/dataStore.js';
import { sendJobChangeAlert } from './services/emailService.js';

// Load environment variables
dotenv.config();

/**
 * Test script to verify email alert functionality
 * 1. Creates test user: Jim Hanson, VP of HR, Jackknife, Inc
 * 2. Updates to: VP of Talent, Realknife, LLC
 * 3. Triggers email alert
 */
async function testEmailAlert() {
  console.log('🧪 Starting email alert test...\n');

  try {
    // Step 1: Create test user
    console.log('Step 1: Creating test user...');
    const testPerson = await addPerson({
      name: 'Jim Hanson',
      company: 'Jackknife, Inc',
      role: 'VP of HR',
      imageUrl: null
    });
    console.log('✅ Created test user:', testPerson.id);
    console.log(`   Name: ${testPerson.name}`);
    console.log(`   Role: ${testPerson.currentJob.role}`);
    console.log(`   Company: ${testPerson.currentJob.company}\n`);

    // Step 2: Update to new role and company
    console.log('Step 2: Updating to new role and company...');
    const previousRole = testPerson.currentJob.role;
    const previousCompany = testPerson.currentJob.company;
    
    const updatedPerson = await updatePerson(testPerson.id, {
      currentJob: {
        company: 'Realknife, LLC',
        role: 'VP of Talent',
        startDate: testPerson.currentJob.startDate
      }
    });

    if (!updatedPerson) {
      throw new Error('Failed to update person');
    }

    console.log('✅ Updated test user');
    console.log(`   Previous: ${previousRole} at ${previousCompany}`);
    console.log(`   New: ${updatedPerson.currentJob.role} at ${updatedPerson.currentJob.company}\n`);

    // Step 3: Send email alert
    console.log('Step 3: Sending email alert...');
    const emailResult = await sendJobChangeAlert({
      personName: updatedPerson.name,
      previousRole: previousRole,
      previousCompany: previousCompany,
      newRole: updatedPerson.currentJob.role,
      newCompany: updatedPerson.currentJob.company,
      confidence: 100, // Test with 100% confidence
      evidence: [
        {
          type: 'company_change',
          source: 'https://test.example.com',
          snippet: 'Test evidence: Jim Hanson has moved to Realknife, LLC as VP of Talent',
          extractedRole: updatedPerson.currentJob.role,
          extractedCompany: updatedPerson.currentJob.company,
          keywords: ['moved', 'new role'],
          hasDate: true
        }
      ]
    });

    if (emailResult.success) {
      console.log('✅ Email alert sent successfully!');
      console.log(`   Email IDs: ${emailResult.emailIds?.join(', ') || 'N/A'}`);
      console.log(`   Check inbox: ${process.env.EMAIL_RECIPIENTS}\n`);
    } else {
      console.error('❌ Failed to send email alert:', emailResult.error);
      process.exit(1);
    }

    console.log('✅ Test completed successfully!');
    console.log(`\nTest user ID: ${testPerson.id}`);
    console.log('You can delete this test user via the API or frontend if needed.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailAlert();
