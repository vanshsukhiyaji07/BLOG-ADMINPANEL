
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const DEFAULT_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@blog.local';
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

async function ensurePlaceholderImage() {
    const uploadDir = path.join(__dirname, 'uploads', 'admins');
    const imgPath = path.join(uploadDir, 'seed-default.png');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(imgPath)) {
        // 1x1 transparent PNG
        const pngBase64 =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        fs.writeFileSync(imgPath, Buffer.from(pngBase64, 'base64'));
    }
    return '/uploads/admins/seed-default.png';
}

async function main() {
    try {
        await mongoose.connect('mongodb://127.0.0.1/blog-admin-db');
        console.log('Connected to DB');

        const existing = await Admin.findOne({ email: DEFAULT_EMAIL });
        if (existing) {
            console.log('Admin already exists:', DEFAULT_EMAIL);
            console.log('You can login with this email and your existing password.');
            process.exit(0);
        }

        const profileImage = await ensurePlaceholderImage();

        const admin = new Admin({
            firstName: 'Super',
            lastName: 'Admin',
            email: DEFAULT_EMAIL,
            password: DEFAULT_PASSWORD,
            contactNumber: '0000000000',
            gender: 'Other',
            hobby: [],
            description: 'Default seeded admin user',
            profileImage,
        });

        await admin.save();

        console.log('Seeded admin successfully.');
        console.log('Email:', DEFAULT_EMAIL);
        console.log('Password:', DEFAULT_PASSWORD);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();


