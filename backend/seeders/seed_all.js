

async function seedAll() {
    try {
        console.log('Starting full data seeding...');

        const registerData = {
            company_name: "RestoBoard Demo",
            store_name: "Main Branch",
            print_name: "RestoBoard",
            restaurant_type: "SELF_SERVICE",
            financial_year_start: "2024-04-01",
            financial_year_end: "2025-03-31",
            books_from: "2024-04-01",
            address: "123 Tech Park, Bangalore",
            fssai_no: "12345678901234",
            gstin: "12ABCDE1234P1Z2",
            owner_name: "Admin User",
            email: "admin@restoboard.com",
            mobile: "9988776655",
            password: "password123",
            confirm_password: "password123",
            security_control_enabled: true
        };

        console.log('Registering/Login restaurant...');
        let loginToken;
        const regRes = await fetch('http://localhost:5055/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerData)
        });

        const regData = await regRes.json();
        if (regRes.ok) {
            loginToken = regData.token;
            console.log('Registration successful');
        } else {
            console.log('Registration failed (might exist), attempting login...');
            const logRes = await fetch('http://localhost:5055/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "admin@restoboard.com",
                    password: "password123"
                })
            });
            const logData = await logRes.json();
            if (!logRes.ok) throw new Error('Login failed: ' + logData.message);
            loginToken = logData.token;
            console.log('Login successful');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginToken}`
        };

        // 1. Create Categories
        console.log('Creating categories...');
        const categories = ["Beverages", "Main Course", "Desserts", "Starters"];
        const createdCategories = [];
        for (const catName of categories) {
            const res = await fetch('http://localhost:5055/api/categories', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: catName, description: catName + ' details' })
            });
            const data = await res.json();
            if (res.ok) createdCategories.push(data.data);
        }
        console.log(`Created ${createdCategories.length} categories`);

        // 2. Create Products
        console.log('Creating products...');
        const products = [
            { name: "Coffee", category: "Beverages", selling_price: 50, purchase_price: 20, product_type: "BUY_SELL" },
            { name: "Tea", category: "Beverages", selling_price: 30, purchase_price: 10, product_type: "BUY_SELL" },
            { name: "Burger", category: "Starters", selling_price: 120, purchase_price: 60, product_type: "BUY_SELL" },
            { name: "Pizza", category: "Main Course", selling_price: 250, purchase_price: 120, product_type: "BUY_SELL" },
            { name: "Ice Cream", category: "Desserts", selling_price: 80, purchase_price: 40, product_type: "BUY_SELL" }
        ];
        for (const prod of products) {
            await fetch('http://localhost:5055/api/products', {
                method: 'POST',
                headers,
                body: JSON.stringify(prod)
            });
        }
        console.log('Products created');

        // 3. Create Counter
        console.log('Creating counter...');
        const counterRes = await fetch('http://localhost:5055/api/counters', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: "Main Counter", code: "MC01" })
        });
        const counterData = await counterRes.json();
        console.log('Counter created:', counterData.data?.name);

        console.log('\nSeeding complete!');
        console.log('Use these credentials to login:');
        console.log('Email: admin@restoboard.com');
        console.log('Password: password123');

    } catch (error) {
        console.error('Seeding error:', error.message);
    }
}

seedAll();
