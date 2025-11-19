import mongoose from 'mongoose';

export const ConnectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        console.log(' محاولة الاتصال بقاعدة البيانات...');
        
        // Connect to MongoDB
        await mongoose.connect(mongoURI);
        
        console.log(' تم الاتصال بقاعدة البيانات بنجاح!');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(' خطأ في اتصال MongoDB:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('  تم قطع الاتصال بقاعدة البيانات');
        });

        mongoose.connection.on('reconnected', () => {
            console.log(' تم إعادة الاتصال بقاعدة البيانات');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('تم إغلاق اتصال MongoDB');
            process.exit(0);
        });

    } catch (error) {
        console.error('\n خطأ في الاتصال بقاعدة البيانات:', error.message);      
        throw error;
    }
}