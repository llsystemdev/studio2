
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/contract/create';

const testPayload = {
  vehicle: {
    id: 'v_test_001',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    plate: 'A123456',
    // Add any other required vehicle fields here to match the Vehicle type
    vin: '1234567890ABCDEFG',
    color: 'Black',
    class: 'Sedan',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    seats: 5,
    doors: 4,
    dailyRate: 50,
    features: ['Bluetooth', 'Backup Camera'],
    status: 'available',
    location: 'Main Office',
    imageUrl: 'https://example.com/civic.jpg',
  },
  customerData: {
    name: 'Rosa Martinez',
    email: 'rosa.martinez@example.com',
    phone: '809-555-1234',
  },
  dateRange: {
    from: '2025-09-10T10:00:00Z',
    to: '2025-09-15T10:00:00Z',
  },
  insuranceCost: 50,
  totalCost: 350,
};

async function runTest() {
  console.log('🚀 Starting pre-contract creation test...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📡 Request sent to: ${API_URL}`);
    console.log(`📈 Response Status: ${response.status}`);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
      console.log('✅ Response is valid JSON.');
      console.log('📄 Response Body:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.error('❌ FATAL: Response is not valid JSON!');
      console.error('📄 Raw Response Text:', responseText);
      throw new Error('JSON parsing failed');
    }

    if (!response.ok) {
      console.error(`❌ Test Failed: Server returned status ${response.status}`);
      return;
    }
    
    if (responseData.success === true && responseData.contractId && typeof responseData.contractId === 'string') {
      console.log(`✅✅✅ Test Passed!`);
      console.log(`📄 Successfully created pre-contract with ID: ${responseData.contractId}`);
    } else {
      console.error('❌ Test Failed: Response data is missing `success: true` or a valid `contractId`.');
      console.error('📄 Received data:', responseData);
    }

  } catch (error) {
    console.error('❌ Test Failed with error:', error.message);
  } finally {
    console.log('🏁 Test finished.');
  }
}

runTest();
