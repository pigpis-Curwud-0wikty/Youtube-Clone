import mongoose from 'mongoose';

export const ConnectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        // Connection options for MongoDB Atlas
        const options = {
            serverSelectionTimeoutMS: 10000, // زيادة الوقت للاتصال
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            retryWrites: true,
            w: 'majority',
        };

        console.log('🔄 محاولة الاتصال بقاعدة البيانات...');
        
        // Connect to MongoDB
        await mongoose.connect(mongoURI, options);
        
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ خطأ في اتصال MongoDB:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  تم قطع الاتصال بقاعدة البيانات');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ تم إعادة الاتصال بقاعدة البيانات');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('تم إغلاق اتصال MongoDB');
            process.exit(0);
        });

    } catch (error) {
        console.error('\n❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        
        // رسائل خطأ بالعربية
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.error('\n═══════════════════════════════════════════════════════');
            console.error('⚠️  خطأ: عنوان IP غير مسموح به');
            console.error('═══════════════════════════════════════════════════════');
            console.error('المشكلة: عنوان IP الخاص بك غير موجود في قائمة المسموح بها في MongoDB Atlas');
            console.error('\n📋 خطوات الحل:');
            console.error('1. اذهب إلى: https://cloud.mongodb.com/');
            console.error('2. اختر مشروعك (Project)');
            console.error('3. اضغط على "Network Access" أو "IP Access List"');
            console.error('4. اضغط على "Add IP Address"');
            console.error('5. اختر "Add Current IP Address" لإضافة IP الحالي');
            console.error('   أو أضف 0.0.0.0/0 للسماح بجميع العناوين (للتطوير فقط)');
            console.error('6. اضغط "Confirm"');
            console.error('\n🔗 رابط المساعدة:');
            console.error('https://www.mongodb.com/docs/atlas/security-whitelist/');
            console.error('═══════════════════════════════════════════════════════\n');
        } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.error('\n⚠️  خطأ SSL/TLS:');
            console.error('هناك مشكلة في الاتصال الآمن');
            console.error('تأكد من صحة سلسلة الاتصال (Connection String)');
        } else if (error.message.includes('authentication') || error.message.includes('auth')) {
            console.error('\n⚠️  خطأ في المصادقة:');
            console.error('اسم المستخدم أو كلمة المرور غير صحيحة');
            console.error('تأكد من بيانات الدخول في ملف .env');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n⚠️  خطأ في الشبكة:');
            console.error('لا يمكن الوصول إلى خادم MongoDB');
            console.error('تأكد من اتصالك بالإنترنت وصحة اسم الخادم');
        }
        
        throw error;
    }
}