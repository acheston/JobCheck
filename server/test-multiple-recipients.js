/**
 * Test script for multiple email recipients
 * Run this from the server directory: node test-multiple-recipients.js
 * 
 * This script will:
 * 1. Find Jim Hanson in the database
 * 2. Update his email recipients to include three addresses
 * 3. Change his job to trigger an email alert
 */

import dotenv from 'dotenv';
import { getAllPeople, updatePerson } from './services/dataStore.js';
import { sendJobChangeAlert } from './services/emailService.js';

dotenv.config({ path: '.env' });

const API_URL = 'http://localhost:3001';

async function testMultipleRecipients() {
  console.log('🧪 Testing multiple email recipients for Jim Hanson...\n');

  try {
    // Step 1: Find Jim Hanson
    console.log('Step 1: Finding Jim Hanson...');
    const people = await getAllPeople();
    const jim = people.find(p => p.name === 'Jim Hanson');
    
    if (!jim) {
      console.error('❌ Jim Hanson not found in database');
      console.log('Available people:', people.map(p => p.name).join(', ') || 'None');
      process.exit(1);
    }

    console.log(`✅ Found Jim Hanson (ID: ${jim.id})`);
    console.log(`   Current role: ${jim.currentJob?.role || 'Unknown'}`);
    console.log(`   Current company: ${jim.currentJob?.company || 'Unknown'}`);
    console.log(`   Current recipients: ${(jim.emailRecipients || []).join(', ') || 'None'}\n`);

    // Step 2: Update email recipients
    console.log('Step 2: Updating email recipients...');
    
    // Resend in testing mode only allows:
    // 1. Verified email addresses in your Resend account
    // 2. Test addresses: delivered@resend.dev, bounced@resend.dev, complained@resend.dev
    //
    // To send to real addresses, you need to:
    // 1. Verify your domain in Resend dashboard (https://resend.com/domains)
    // 2. Update EMAIL_FROM in .env to use your verified domain
    // 3. Then you can send to any email address
    
    const recipients = [
      'delivered+aric@resend.dev',
      'delivered+cheston@resend.dev', 
      'delivered+terra@resend.dev'
    ];
    
    console.log('⚠️  Using Resend test addresses for this test');
    console.log('   These will be delivered to Resend\'s test inbox');
    console.log('   To use real addresses (aric.cheston@gmail.com, etc.):');
    console.log('   1. Verify your domain in Resend dashboard');
    console.log('   2. Update EMAIL_FROM in .env to use your verified domain');
    console.log('   3. Then update the recipients array in this script\n');

    const updatedWithRecipients = await updatePerson(jim.id, {
      emailRecipients: recipients
    });

    if (!updatedWithRecipients) {
      throw new Error('Failed to update email recipients');
    }

    console.log(`✅ Updated email recipients to:`);
    recipients.forEach(email => console.log(`   - ${email}`));
    console.log('');

    // Step 3: Change job to trigger alert
    console.log('Step 3: Changing job to trigger email alert...');
    const previousRole = updatedWithRecipients.currentJob?.role;
    const previousCompany = updatedWithRecipients.currentJob?.company;
    
    const updatedJob = await updatePerson(jim.id, {
      currentJob: {
        company: 'DaggerNight, Inc',
        role: 'Talent Business Partner',
        startDate: updatedWithRecipients.currentJob?.startDate || new Date().toISOString().split('T')[0]
      }
    });

    if (!updatedJob) {
      throw new Error('Failed to update job');
    }

    console.log(`✅ Updated job:`);
    console.log(`   Previous: ${previousRole} at ${previousCompany}`);
    console.log(`   New: ${updatedJob.currentJob.role} at ${updatedJob.currentJob.company}\n`);

    // Step 4: Send email alert
    console.log('Step 4: Sending email alert to all recipients...');
    const emailResult = await sendJobChangeAlert({
      personName: updatedJob.name,
      previousRole: previousRole,
      previousCompany: previousCompany,
      newRole: updatedJob.currentJob.role,
      newCompany: updatedJob.currentJob.company,
      confidence: 100,
      evidence: [
        {
          type: 'company_change',
          source: 'https://test.example.com',
          snippet: 'Test: Jim Hanson has moved to DaggerNight, Inc as Talent Business Partner',
          extractedRole: updatedJob.currentJob.role,
          extractedCompany: updatedJob.currentJob.company,
          keywords: ['moved', 'new role'],
          hasDate: true
        }
      ],
      recipients: updatedJob.emailRecipients || recipients
    });

    if (emailResult.success) {
      console.log('✅ Email alert sent successfully!');
      console.log(`   Sent to ${recipients.length} recipient(s):`);
      recipients.forEach(email => console.log(`   - ${email}`));
      console.log(`\n📧 Check the inboxes for all three email addresses!\n`);
    } else {
      console.error('❌ Failed to send email alert:', emailResult.error);
      process.exit(1);
    }

    console.log('✅ Test completed successfully!');
    console.log(`\nJim Hanson's updated record:`);
    console.log(`   ID: ${updatedJob.id}`);
    console.log(`   Role: ${updatedJob.currentJob.role}`);
    console.log(`   Company: ${updatedJob.currentJob.company}`);
    console.log(`   Email Recipients: ${(updatedJob.emailRecipients || []).join(', ')}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testMultipleRecipients();
