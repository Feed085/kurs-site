const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherAuthRoutes = require('./routes/teacherAuth');
const teacherRoutes = require('./routes/teacher');
const courseRoutes = require('./routes/course');
const uploadRoutes = require('./routes/upload');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const adminAuthRoutes = require('./routes/adminAuth');
const categoryRoutes = require('./routes/categories');
const publicRoutes = require('./routes/public');
const AdminExamLeaveSession = require('./models/AdminExamLeaveSession');

app.use('/api/student/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher/auth', teacherAuthRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/public', publicRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Sizin Akademiyanız Backend API Kurulumu Tamamlandı');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Bağlantısı Başarılı');

    await AdminExamLeaveSession.syncIndexes();

    const server = app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor.`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} kullanımda. Lütfen çalışan eski backend sürecini kapatın.`);
        process.exit(1);
      }

      throw error;
    });
  })
  .catch((err) => {
    console.error('MongoDB Bağlantı Hatası:', err);
  });
