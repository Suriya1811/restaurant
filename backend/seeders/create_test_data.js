async function createTestData() {
    try {
        console.log('Creating test data...');
        
        // Register a test restaurant
        const registerData = {
            company_name: "Test Restaurant",
            store_name: "Test Store",
            print_name: "Test Restaurant",
            restaurant_type: "SELF_SERVICE",
            financial_year_start: "2024-04-01",
            financial_year_end: "2025-03-31",
            books_from: "2024-04-01",
            address: "123 Test Street, Test City",
            fssai_no: "12345678901234",
            gstin: "12ABCDE1234PZ",
            owner_name: "Test Owner",
            email: "test@example.com",
            mobile: "9876543210",
            password: "password123",
            confirm_password: "password123",
            security_control_enabled: true
        };
        
        console.log('Registering restaurant...');
        const registerResponse = await fetch('http://localhost:5055/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });
        
        const registerResult = await registerResponse.json();
        console.log('Registration response:', registerResult);
        
        if (!registerResponse.ok) {
            console.log('Registration failed, trying to login with existing account...');
            // Try to login instead
            const loginResponse = await fetch('http://localhost:5055/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "test@example.com",
                    password: "password123"
                })
            });
            
            const loginResult = await loginResponse.json();
            if (!loginResponse.ok) {
                console.error('Login failed:', loginResult);
                return;
            }
            
            const loginToken = loginResult.token;
            console.log('Login successful');
            await createBillData(loginToken);
            return;
        }
        
        const loginToken = registerResult.token;
        console.log('Registration successful');
        
        await createBillData(loginToken);
        
    } catch (error) {
        console.error('Error creating test data:', error.message);
    }
}

async function createBillData(token) {
    try {
        // Create a counter
        console.log('Creating counter...');
        const counterResponse = await fetch('http://localhost:5055/api/counters', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: "Counter 1", code: "C001" })
        });
        
        const counterResult = await counterResponse.json();
        if (!counterResponse.ok) {
            console.error('Counter creation failed:', counterResult);
            return;
        }
        
        const counterId = counterResult.data._id;
        console.log('Created counter');
        
        // Create and pay a bill
        console.log('Creating and paying bill...');
        const billResponse = await fetch('http://localhost:5055/api/bills', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ counter_id: counterId, type: "SELF_SERVICE" })
        });
        
        const billResult = await billResponse.json();
        if (!billResponse.ok) {
            console.error('Bill creation failed:', billResult);
            return;
        }
        
        const billId = billResult.data._id;
        console.log('Created bill:', billId);
        
        // Process payment (this will create the payment data)
        const paymentResponse = await fetch(`http://localhost:5055/api/bills/${billId}/pay`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                payment_modes: [{ type: "UPI", amount: 100 }] 
            })
        });
        
        const paymentResult = await paymentResponse.json();
        if (!paymentResponse.ok) {
            console.error('Payment failed:', paymentResult);
            return;
        }
        
        console.log('Payment processed successfully');
        console.log('Test data creation completed!');
        console.log('\nYou can now check the dashboard to see the payment data.');
        
    } catch (error) {
        console.error('Error creating bill data:', error.message);
    }
}

createTestData();